# EkviraExportHouse — Email Automation Hub

AI-powered email automation for export trade clients. Built with React + Vite, deployed on Vercel.

---

## Deploy to Vercel (5 minutes)

### Step 1 — Push to GitHub

```bash
cd ekvira-email
git init
git add .
git commit -m "Initial commit"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/ekvira-email.git
git push -u origin main
```

### Step 2 — Connect to Vercel

1. Go to **vercel.com** → Sign up / Log in (free)
2. Click **"Add New Project"**
3. Import your GitHub repo (`ekvira-email`)
4. Framework preset will auto-detect as **Vite** — leave defaults

### Step 3 — Add your API key (Environment Variable)

In Vercel project settings, before deploying:

1. Go to **Settings → Environment Variables**
2. Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-xxxxxxxxxxxxxxxxxxxx` ← your key from console.anthropic.com
3. Click **Save**

### Step 4 — Deploy

Click **Deploy**. Vercel builds and gives you a live URL like:
```
https://ekvira-email.vercel.app
```

Share that URL with your client. Done. ✅

---

## Local development

```bash
npm install

# Create a .env file for local testing:
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env

npm run dev
# Open http://localhost:5173
```

---

## Project structure

```
ekvira-email/
├── api/
│   └── chat.js          ← Vercel serverless function (API proxy)
├── src/
│   ├── main.jsx         ← React entry point
│   └── App.jsx          ← Full app (all 4 tabs)
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```

## Security note

Your Anthropic API key lives only in Vercel's environment variables — it is **never** sent to the browser. All AI calls go through `/api/chat` (a server-side function), keeping the key safe.
