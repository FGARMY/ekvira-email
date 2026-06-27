import { google } from 'googleapis';

export default async function handler(req, res) {
  // Allow manual triggering from frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const xaiKey = process.env.XAI_API_KEY;

    if (!refreshToken || !xaiKey) {
      return res.status(500).json({ error: 'Missing environment variables (GOOGLE_REFRESH_TOKEN or XAI_API_KEY)' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 1. Fetch unread messages
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: 5 // Process up to 5 at a time
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) {
      return res.status(200).json({ status: 'success', message: 'No unread emails found.', processed: 0 });
    }

    let processedCount = 0;
    const logs = [];

    for (const msg of messages) {
      // 2. Read full message
      const msgData = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id
      });
      
      const payload = msgData.data.payload;
      const headers = payload.headers;
      
      const fromHeader = headers.find(h => h.name === 'From');
      const subjectHeader = headers.find(h => h.name === 'Subject');
      const messageIdHeader = headers.find(h => h.name === 'Message-ID');
      
      const sender = fromHeader ? fromHeader.value : 'Unknown';
      const subject = subjectHeader ? subjectHeader.value : 'No Subject';
      const messageId = messageIdHeader ? messageIdHeader.value : '';

      // Skip replies from ourselves if they somehow appear in inbox unread
      if (sender.includes('EkviraExportHouse') || sender.includes('me')) continue;

      let bodyText = '';
      if (payload.parts) {
        const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
        if (textPart && textPart.body && textPart.body.data) {
          bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      } else if (payload.body && payload.body.data) {
        bodyText = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      }

      // 3. Mark as read
      await gmail.users.messages.modify({
        userId: 'me',
        id: msg.id,
        requestBody: { removeLabelIds: ['UNREAD'] }
      });

      // 4. Generate AI Reply using Grok
      const prompt = `You are the AI assistant for EkviraExportHouse, an Indian export trading company. 
We received an email from: ${sender}
Subject: ${subject}
Message: ${bodyText}

Please write a polite and professional response email. Return ONLY the body of the email. Do not include the subject line or any commentary.`;

      const aiResponse = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${xaiKey}`
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const aiData = await aiResponse.json();
      const replyBody = aiData.choices && aiData.choices[0] && aiData.choices[0].message 
        ? aiData.choices[0].message.content 
        : "Thank you for your email. We will get back to you shortly.";

      // 5. Send reply via Gmail API
      const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
      const toAddress = sender.match(/<([^>]+)>/) ? sender.match(/<([^>]+)>/)[1] : sender;

      const emailLines = [];
      emailLines.push(`To: ${toAddress}`);
      emailLines.push(`Subject: ${replySubject}`);
      if (messageId) {
        emailLines.push(`In-Reply-To: ${messageId}`);
        emailLines.push(`References: ${messageId}`);
      }
      emailLines.push('Content-Type: text/plain; charset="UTF-8"');
      emailLines.push('');
      emailLines.push(replyBody);

      const rawEmail = Buffer.from(emailLines.join('\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: rawEmail }
      });

      logs.push(`Replied to ${toAddress} regarding "${subject}"`);
      processedCount++;
    }

    return res.status(200).json({ status: 'success', processed: processedCount, logs });
  } catch (error) {
    console.error('Check emails error:', error);
    return res.status(500).json({ error: 'Failed to check emails', detail: error.message });
  }
}
