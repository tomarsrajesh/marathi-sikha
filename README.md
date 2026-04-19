# मराठी शिका — Deploy Guide

## Your project has 3 files:
```
marathi-app/
├── api/
│   └── translate.js      ← Backend (hides your API key)
├── public/
│   ├── index.html        ← Your website
│   └── manifest.json     ← Makes it installable as app
└── vercel.json           ← Deployment config
```

---

## Deploy in 5 steps (FREE, takes 10 minutes)

### Step 1 — Create GitHub account
Go to https://github.com → Sign up (free)

### Step 2 — Create new repository
- Click "New repository"
- Name it: `marathi-app`
- Click "Create repository"
- Upload all 4 files maintaining the folder structure

### Step 3 — Create Vercel account
Go to https://vercel.com → Sign up with GitHub (free)

### Step 4 — Deploy
- Click "New Project"
- Import your `marathi-app` GitHub repo
- Click "Deploy" — Vercel builds it automatically

### Step 5 — Add your API key (IMPORTANT)
- In Vercel dashboard → Your project → Settings → Environment Variables
- Add:  Name = `ANTHROPIC_API_KEY`  Value = `sk-ant-api03-your-key-here`
- Click Save → Redeploy

---

## Your app is now LIVE!
- Vercel gives you a free URL like: `marathi-app.vercel.app`
- Share this link with anyone — works on Android, iPhone, PC
- Users can tap "Add to Home Screen" in Chrome to install it like an app

---

## Your API key is SAFE because:
- It's stored as an environment variable on Vercel's server
- It never appears in the website code
- Users never see it
- Only your server uses it to call Claude

---

## Cost estimate
- Vercel hosting: FREE
- Anthropic API: ~$0.001 per translation (Claude Haiku)
- 1000 translations = ~$1
- You get $5 free credits to start

---

## Need help?
Share the error message and I'll help you fix it!
