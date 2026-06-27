import { google } from 'googleapis';

export default async function handler(req, res) {
  // Allow manual triggering from frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!refreshToken || !geminiKey) {
      return res.status(500).json({ error: 'Missing environment variables (GOOGLE_REFRESH_TOKEN or GEMINI_API_KEY)' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Parse rules from request body if POST, otherwise use default
    let customRules = [];
    if (req.method === 'POST') {
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        if (body && body.rules && Array.isArray(body.rules)) {
          customRules = body.rules;
        }
      } catch (e) {
        console.error('Error parsing rules body', e);
      }
    }
    
    const defaultRule = "Rule 1: For all general inquiries, reply politely thanking them and stating that the EkviraExportHouse team will contact them in a few hours.";
    const activeRulesText = customRules.length > 0 
      ? customRules.map((r, i) => `Rule ${i+1}: ${r}`).join('\n') 
      : defaultRule;

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
      if (sender.includes('EkviraExportHouse') || sender.includes('me')) {
        logs.push(`Skipped ${sender} (self)`);
        await gmail.users.messages.modify({ userId: 'me', id: msg.id, requestBody: { removeLabelIds: ['UNREAD'] } });
        continue;
      }

      // Safeguard: Skip automated emails, no-reply, and mailer-daemon to prevent infinite loops or useless replies
      const lowerSender = sender.toLowerCase();
      if (
        lowerSender.includes('noreply') || 
        lowerSender.includes('no-reply') || 
        lowerSender.includes('mailer-daemon') ||
        lowerSender.includes('donotreply') ||
        lowerSender.includes('bounce')
      ) {
        logs.push(`Skipped automated/no-reply address: ${sender}`);
        await gmail.users.messages.modify({ userId: 'me', id: msg.id, requestBody: { removeLabelIds: ['UNREAD'] } });
        continue;
      }

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
      const prompt = `You are the AI auto-reply assistant for EkviraExportHouse, an Indian export trading company. 
We received an email from: ${sender}
Subject: ${subject}
Message: ${bodyText}

Please read the email and apply the most relevant rule from this list:
${activeRulesText}

If none of the specific rules apply, just write a standard polite acknowledgment stating the team will get back to them.
Write ONLY the body of the response email. Do not include the subject line or any commentary. Keep it professional.`;

      const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const aiData = await aiResponse.json();
      let replyBody = "Thank you for your email. We will get back to you shortly.";
      
      if (!aiResponse.ok) {
        console.error("Gemini API Error:", aiData);
        logs.push(`Gemini AI Failed: ${aiData.error?.message || 'Unknown error'}`);
      } else if (aiData.candidates && aiData.candidates[0] && aiData.candidates[0].content && aiData.candidates[0].content.parts[0]) {
        replyBody = aiData.candidates[0].content.parts[0].text;
      } else {
        logs.push("Gemini returned unexpected data format.");
      }

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
