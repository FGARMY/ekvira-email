import { google } from 'googleapis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to, subject, body, attachments } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
  }

  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!refreshToken) {
    return res.status(500).json({ error: 'Gmail account not linked. Please link your Gmail account in the Auto-reply tab first.' });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const emailLines = [];
    emailLines.push(`To: ${to}`);
    emailLines.push(`Subject: ${subject}`);
    emailLines.push('MIME-Version: 1.0');

    if (attachments && attachments.length > 0) {
      const boundary = 'foo_bar_baz_boundary';
      emailLines.push(`Content-Type: multipart/mixed; boundary=${boundary}`);
      emailLines.push('');
      emailLines.push(`--${boundary}`);
      emailLines.push('Content-Type: text/plain; charset="UTF-8"');
      emailLines.push('');
      emailLines.push(body);
      emailLines.push('');
      
      for (const att of attachments) {
        emailLines.push(`--${boundary}`);
        emailLines.push(`Content-Type: ${att.mimeType || 'application/octet-stream'}; name="${att.name}"`);
        emailLines.push(`Content-Disposition: attachment; filename="${att.name}"`);
        emailLines.push('Content-Transfer-Encoding: base64');
        emailLines.push('');
        const b64Data = att.base64.replace(/^data:.*,/, '');
        emailLines.push(b64Data);
        emailLines.push('');
      }
      emailLines.push(`--${boundary}--`);
    } else {
      emailLines.push('Content-Type: text/plain; charset="UTF-8"');
      emailLines.push('');
      emailLines.push(body);
    }

    const rawEmail = Buffer.from(emailLines.join('\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const info = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawEmail }
    });

    return res.status(200).json({ success: true, messageId: info.data.id });
  } catch (err) {
    console.error('Error sending email:', err);
    return res.status(500).json({ error: 'Failed to send email via Gmail API', detail: err.message });
  }
}
