import { google } from 'googleapis';

export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Missing code');
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/api/auth/callback'
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    // In a real production app, we would store this refresh_token securely in a DB.
    // Since we don't have a DB here, we'll output it so the user can add it to their Vercel env.
    const html = `
      <html>
        <body style="font-family: sans-serif; padding: 2rem;">
          <h2>Authentication Successful!</h2>
          <p>Please copy your refresh token below and add it to your <code>.env.local</code> and Vercel Environment Variables as <code>GOOGLE_REFRESH_TOKEN</code>.</p>
          <textarea style="width: 100%; height: 100px; padding: 10px;" readonly>${tokens.refresh_token || 'No refresh token returned. Did you force prompt=consent?'}</textarea>
          <br/><br/>
          <button onclick="window.close()">Close window</button>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).send('Error exchanging token: ' + error.message);
  }
}
