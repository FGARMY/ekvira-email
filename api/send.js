import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS for local testing/development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
  }

  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    return res.status(500).json({ error: 'SMTP credentials not configured on server' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // Defaulting to Gmail for this integration
      port: 465,
      secure: true,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"EkviraExportHouse CRM" <${user}>`,
      to,
      subject,
      text: body,
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('Error sending email:', err);
    return res.status(500).json({ error: 'Failed to send email', detail: err.message });
  }
}
