import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Simple Vite plugin to mock the Vercel API routes locally
const apiPlugin = () => ({
  name: 'api-plugin',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url === '/api/chat') {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end('Method not allowed');
        }

        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body);
            const apiKey = process.env.XAI_API_KEY;
            
            if (!apiKey) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: 'XAI_API_KEY not configured locally' }));
            }
            
            const response = await fetch('https://api.x.ai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify(payload),
            });

            const data = await response.json();
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = response.status;
            res.end(JSON.stringify(data));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to reach Grok API', detail: err.message }));
          }
        });
      } else if (req.url === '/api/send') {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end('Method not allowed');
        }

        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          // For local mocking without actual SMTP setup in Vite, we can just return a success payload.
          // The actual api/send.js will handle the real Vercel deployment.
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, message: 'Mock email sent locally (check Vite console)', details: JSON.parse(body) }));
          console.log('[Local Mock] Simulated sending email:', JSON.parse(body));
        });
      } else {
        next();
      }
    });
  }
});

export default defineConfig({
  plugins: [react(), apiPlugin()],
})
