const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_RESEARCH_PAGE_ID = "34b020873cd680e0b346f633687dcb1f";

function buildPrompt(topic, mode, urls) {
  if (mode === "scout") {
    return `Run the Content Scout on: "${topic}"

Search the web for the most relevant recent content on this topic.

Evaluation criteria — only surface content meeting at least one of:
- Proof the system or workflow generates measurable income or saves cost
- Real customer stories or named companies using the tool
- Practitioner-built systems with actual use cases — not theory

Skip: AI influencer content (high followers, low substance), vendor marketing without independent validation, articles recycling generic statistics without citing the original study.

For each result return:
- Title and source (URL)
- Type: article / video / podcast / tool
- One-line summary
- Relevance score 1–5 with one sentence of reasoning

Group results by theme. Prioritize last 12 months. Max 10 results. Include relevant YouTube demos in a separate section at the bottom.`;
  }

  if (mode === "analyze") {
    return `Analyze the following sources and produce a Deep Analyzer note and Weekly Digest.

SOURCES:
${urls}

For each source produce this exact structure:

TITLE:
SOURCE & LINK:
TYPE:
DATE PUBLISHED:
SOURCE CREDIBILITY: [Vendor-authored / Independent / Academic / Trade Press / Practitioner] — one sentence on why this matters for trust.

CORE IDEA (2-3 sentences, plain language, no jargon):

WHO IS USING IT: Named companies or industries only. If none: "UNVERIFIED — no named companies in this source."

PROOF OF VALUE: Every metric (revenue, cost savings, time saved, conversion rates). For each: the claim / who measured it / confidence level HIGH/MEDIUM/LOW.

KEY AI USE CASES MENTIONED:

WHAT YOU CAN ACTUALLY BUILD: Step-by-step workflow. If not enough detail, say so.

DIFFICULTY: Beginner / Intermediate / Advanced — one sentence explaining why.

TOOLS & TECH REFERENCED:

GAPS & WEAKNESSES:

MY NEXT ACTION: One concrete step doable in 48 hours.

NOTION TAGS: from #use-case #tool #automation #sales #marketing #operations #finance #hr #customer-service #agents #RAG #no-code #revenue-proven #early-stage #unverified

Then synthesize everything into the Weekly Digest (sections 1-6 below).

Quality rule: STRONG = named company + verified metric + independent. MODERATE = one but not both. WEAK = neither. Flag WEAK sources visibly.

## 1. SESSION BRIEF
## 2. TOP 3 INSIGHTS
## 3. ACTION STACK
## 4. NOTION DATABASE ROWS
| Name | Category | Function | Source | One-line summary | Evidence | Status | Tags |
## 5. RESEARCH BACKLOG
## 6. WEEKLY SNAPSHOT`;
  }

  return `Run my full 3-stage AI research pipeline on: "${topic}"

---
STAGE 1 - CONTENT SCOUT

Search the web for the most relevant recent content on: ${topic}

Only surface content meeting at least one of:
- Proof the system generates measurable income or saves cost
- Real customer stories or named companies using the tool
- Practitioner-built systems with actual use cases - not theory

Skip: AI influencer content (high followers, low substance), vendor marketing without independent validation, generic statistics without citing original studies.

For each result:
- Title and source (URL)
- Type: article / video / podcast / tool
- One-line summary
- Relevance score 1-5 with one sentence of reasoning

Group results by theme. Prioritize last 12 months. Max 10 results. Include relevant YouTube demos in a separate section.

---
STAGE 2 - DEEP ANALYZER

For the top 3 results from Stage 1, generate a structured research note for each:

TITLE:
SOURCE & LINK:
TYPE:
DATE PUBLISHED:
SOURCE CREDIBILITY: [Vendor-authored / Independent / Academic / Trade Press / Practitioner] - one sentence.

CORE IDEA (2-3 sentences, plain language, no jargon):

WHO IS USING IT: Named companies or industries only. If none: "UNVERIFIED - no named companies in this source."

PROOF OF VALUE: Every specific metric. For each: the claim / who measured it / confidence level HIGH/MEDIUM/LOW.

KEY AI USE CASES MENTIONED:

WHAT YOU CAN ACTUALLY BUILD: Step-by-step workflow. If not enough detail, say so.

DIFFICULTY: Beginner / Intermediate / Advanced - one sentence.

TOOLS & TECH REFERENCED:

GAPS & WEAKNESSES:

MY NEXT ACTION: One concrete step doable in 48 hours.

NOTION TAGS: from #use-case #tool #automation #sales #marketing #operations #finance #hr #customer-service #agents #RAG #no-code #revenue-proven #early-stage #unverified

---
STAGE 3 - WEEKLY DIGEST

Synthesize everything above into this exact format:

## 1. SESSION BRIEF
This week's topic:
Sessions covered:
Strongest finding:
Watch out for:
Maturity signal:

## 2. TOP 3 INSIGHTS
Ranked by credibility + relevance to Automation, Analytics, Customer Service, Product & Engineering.
For each: Insight / Evidence quality (STRONG/MODERATE/WEAK) / Relevant to / So what.

## 3. ACTION STACK
BUILD OR TEST THIS WEEK:
DEMO OR EVALUATE:
RESEARCH DEEPER NEXT SESSION:

## 4. NOTION DATABASE ROWS
| Name | Category | Function | Source | One-line summary | Evidence | Status | Tags |

## 5. RESEARCH BACKLOG
UNVERIFIED:
UNDEREXPLORED:
READY TO BUILD:

## 6. WEEKLY SNAPSHOT
3-4 sentences. Briefing a smart colleague who missed the session. Paste-ready for Slack or client update.

Quality rule: STRONG = named company + verified metric + independent. MODERATE = one but not both. WEAK = neither. Flag WEAK sources visibly.`;
}

function markdownToNotionBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];

  for (const line of lines) {
    if (!line.trim()) {
      blocks.push({ object: "block", type: "paragraph", paragraph: { rich_text: [] } });
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ object: "block", type: "heading_2", heading_2: { rich_text: [{ type: "text", text: { content: line.slice(3).trim() } }] } });
    } else if (line.startsWith("### ")) {
      blocks.push({ object: "block", type: "heading_3", heading_3: { rich_text: [{ type: "text", text: { content: line.slice(4).trim() } }] } });
    } else if (line.startsWith("- ")) {
      blocks.push({ object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ type: "text", text: { content: line.slice(2).trim() } }] } });
    } else if (line.match(/^\|[-: ]+\|/)) {
      // skip separator rows
    } else if (line.startsWith("| ")) {
      const content = line.replace(/\*\*(.*?)\*\*/g, "$1");
      blocks.push({ object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content }, annotations: { code: true } }] } });
    } else if (line.startsWith("STRONG") || line.startsWith("MODERATE") || line.startsWith("WEAK")) {
      const emoji = line.startsWith("STRONG") ? "✅" : line.startsWith("MODERATE") ? "⚠️" : "🔴";
      blocks.push({ object: "block", type: "callout", callout: { rich_text: [{ type: "text", text: { content: line } }], icon: { emoji } } });
    } else {
      const content = line.replace(/\*\*(.*?)\*\*/g, "$1").trim();
      if (content) blocks.push({ object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content } }] } });
    }
  }
  return blocks;
}

async function postToNotion(topic, mode, fullText) {
  if (!NOTION_TOKEN) return null;

  const date = new Date().toISOString().slice(0, 10);
  const modeLabel = mode === "full" ? "Full Pipeline" : mode === "scout" ? "Scout" : "Analyze + Digest";
  const pageTitle = `${date} — ${topic}`;

  const allBlocks = [
    { object: "block", type: "callout", callout: { rich_text: [{ type: "text", text: { content: `Mode: ${modeLabel} · Generated: ${new Date().toLocaleString("en-GB")}` } }], icon: { emoji: "🔍" } } },
    { object: "block", type: "divider", divider: {} },
    ...markdownToNotionBlocks(fullText)
  ];

  const pageRes = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28"
    },
    body: JSON.stringify({
      parent: { page_id: NOTION_RESEARCH_PAGE_ID },
      icon: { emoji: "🧠" },
      properties: {
        title: { title: [{ type: "text", text: { content: pageTitle } }] }
      },
      children: allBlocks.slice(0, 100)
    })
  });

  if (!pageRes.ok) {
    console.error("Notion page creation failed:", await pageRes.text());
    return null;
  }

  const page = await pageRes.json();
  const pageId = page.id;

  // Append remaining blocks in chunks of 100
  const remaining = allBlocks.slice(100);
  for (let i = 0; i < remaining.length; i += 100) {
    await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({ children: remaining.slice(i, i + 100) })
    });
  }

  return pageId;
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const { topic, mode, urls } = req.body;
  let fullText = "";

  try {
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: buildPrompt(topic, mode, urls) }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
        fullText += event.delta.text;
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
      if (event.type === "message_stop") {
        try {
          const notionPageId = await postToNotion(topic, mode, fullText);
          res.write(`data: ${JSON.stringify({ done: true, notionPageId })}\n\n`);
        } catch (notionErr) {
          console.error("Notion post error:", notionErr.message);
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        }
      }
    }
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  }

  res.end();
};
