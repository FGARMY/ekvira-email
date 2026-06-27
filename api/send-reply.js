import { google } from 'googleapis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { to, subject, body, threadMessageId, gmailId } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing to, subject, or body fields' });
    }

    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    if (!refreshToken) return res.status(500).json({ error: 'Missing GOOGLE_REFRESH_TOKEN' });

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Format reply subject
    const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
    
    const emailLines = [];
    emailLines.push(`To: ${to}`);
    emailLines.push(`Subject: ${replySubject}`);
    if (threadMessageId) {
      emailLines.push(`In-Reply-To: ${threadMessageId}`);
      emailLines.push(`References: ${threadMessageId}`);
    }
    emailLines.push('Content-Type: text/plain; charset="UTF-8"');
    emailLines.push('');
    emailLines.push(body);

    const rawEmail = Buffer.from(emailLines.join('\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    // Send email
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawEmail }
    });

    // Remove UNREAD label if it's a reply to an inbox message
    if (gmailId) {
      try {
        await gmail.users.messages.modify({
          userId: 'me',
          id: gmailId,
          requestBody: { removeLabelIds: ['UNREAD'] }
        });
      } catch (e) {
        console.error("Could not remove UNREAD label", e);
      }
    }

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Send reply error:', error);
    return res.status(500).json({ error: 'Failed to send reply', detail: error.message });
  }
}
