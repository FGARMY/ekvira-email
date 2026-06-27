import { google } from 'googleapis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    if (!refreshToken) {
      return res.status(500).json({ error: 'Missing GOOGLE_REFRESH_TOKEN' });
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
      maxResults: 15 // Limit to 15 unread emails for review
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) {
      return res.status(200).json({ status: 'success', emails: [] });
    }

    const emailList = [];

    for (const msg of messages) {
      const msgData = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id
      });
      
      const payload = msgData.data.payload;
      const headers = payload.headers;
      
      const fromHeader = headers.find(h => h.name === 'From');
      const subjectHeader = headers.find(h => h.name === 'Subject');
      const dateHeader = headers.find(h => h.name === 'Date');
      const messageIdHeader = headers.find(h => h.name === 'Message-ID');
      
      const sender = fromHeader ? fromHeader.value : 'Unknown';
      const subject = subjectHeader ? subjectHeader.value : 'No Subject';
      const date = dateHeader ? dateHeader.value : '';
      const messageId = messageIdHeader ? messageIdHeader.value : '';

      // Skip automated emails and self
      const lowerSender = sender.toLowerCase();
      if (
        lowerSender.includes('noreply') || 
        lowerSender.includes('no-reply') || 
        lowerSender.includes('mailer-daemon') ||
        lowerSender.includes('ekviraexporthouse')
      ) {
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

      emailList.push({
        id: msg.id,
        messageId,
        sender,
        subject,
        date,
        bodySnippet: msgData.data.snippet,
        bodyFull: bodyText
      });
    }

    return res.status(200).json({ status: 'success', emails: emailList });
  } catch (error) {
    console.error('Fetch inbox error:', error);
    return res.status(500).json({ error: 'Failed to fetch inbox', detail: error.message });
  }
}
