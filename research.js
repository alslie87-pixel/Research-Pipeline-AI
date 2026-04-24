# AI Research Pipeline

A one-click research tool that runs Scout → Analyze → Digest in a single prompt,
then exports a PDF file and Notion-ready markdown.

## What it does

1. **Scout** — searches the web for credible, practitioner-built sources on your topic
2. **Analyze** — generates structured Deep Analyzer notes for the top results
3. **Digest** — synthesizes everything into a Weekly Brief with action stack and Notion rows
4. **Export** — download a formatted PDF or copy clean markdown for Notion

---

## Deploy to Vercel (5 minutes)

### Step 1 — Get the code onto GitHub

1. Go to [github.com](https://github.com) and create a new repository (e.g. `ai-research-pipeline`)
2. Upload the files from this folder into the repo:
   - `api/research.js`
   - `public/index.html`
   - `package.json`
   - `vercel.json`

You can drag and drop the files into the GitHub UI — no terminal needed.

### Step 2 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up / log in (free)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"** and select your GitHub repo
4. Vercel auto-detects the config. Click **Deploy**
5. Wait ~60 seconds for the first deploy to finish

### Step 3 — Add your Anthropic API key

1. In your Vercel project, go to **Settings → Environment Variables**
2. Add a new variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your key from [console.anthropic.com](https://console.anthropic.com)
3. Click **Save**
4. Go to **Deployments** and click **Redeploy** on the latest deployment

Your app is now live at `https://your-project.vercel.app` 🎉

---

## Local development (optional)

```bash
npm install -g vercel
npm install
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY
vercel dev
```

Open http://localhost:3000

---

## How to use

1. Enter a research topic (e.g. "AI agents for sales automation")
2. Choose a pipeline mode:
   - **Full pipeline** — Scout finds sources, Analyze breaks them down, Digest briefs you
   - **Scout only** — just source discovery and ranking
   - **Analyze + Digest** — paste URLs you already have
3. Hit **Run Research Pipeline**
4. When done:
   - **Download PDF** — a formatted, branded PDF saved to your downloads
   - **Copy for Notion** — clean markdown, paste into any Notion page

---

## Project structure

```
ai-research-pipeline/
├── api/
│   └── research.js      ← Vercel serverless function (calls Anthropic API)
├── public/
│   └── index.html       ← Frontend (HTML/CSS/JS, no build step needed)
├── package.json
├── vercel.json          ← Routing config
└── .env.example
```

---

## Costs

- Vercel free tier handles ~100GB bandwidth/month — more than enough for personal use
- Anthropic API: each full pipeline run uses ~3,000–4,000 tokens input + ~4,000 output
  At Claude Sonnet rates this is roughly $0.03–0.06 per run
