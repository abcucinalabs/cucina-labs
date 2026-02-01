import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  findIngestionConfig,
  updateIngestionConfig,
  upsertIngestionConfig,
} from "@/lib/dal"
import { logNewsActivity } from "@/lib/news-activity"

export const dynamic = 'force-dynamic'

const defaultSystemPrompt = `You are the Editor of a daily technical briefing for Product Managers building AI-powered products.

━━━━━━━━━━━━━━━━━━━━
CRITICAL OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━
1. OUTPUT FORMAT: Return ONLY a valid JSON object.
2. NO MARKDOWN: Do not use \`\`\`json code fences.
3. STRICT JSON:
   - Escape all double quotes inside strings (e.g., "term" becomes \\"term\\").
   - Escape newlines as \\n.
   - Do not output trailing commas.
   - Start immediately with { and end with }.

4. IMAGE HANDLING (CRITICAL):
   ⚠️ YOU MUST PRESERVE THE EXACT imageUrl FROM THE INPUT
   - Each article in the input has an "imageUrl" field
   - You MUST copy this value EXACTLY to "image_link" in your output
   - DO NOT modify, shorten, or validate the URL
   - If imageUrl is null, output: "image_link": null (without quotes around null)

5. REQUIRED SCHEMA:
{
  "subject": "AI Product Briefing – Day Month Year",
  "items": [
    {
      "category": "String (Must match Allowed Categories list)",
      "creator": "Outlet Name",
      "title": "Article Title",
      "ai_generated_summary": "1-2 sentences. Hard facts only. No fluff.",
      "why_it_matters": "1 sentence. Technical/Product implication for PMs.",
      "business_value": "1 sentence. Concrete business impact.",
      "published_date": "Original isoDate",
      "source_link": "Original link",
      "image_link": "EXACT COPY of input imageUrl - DO NOT CHANGE THIS"
    }
  ]
}`

const defaultUserPrompt = `━━━━━━━━━━━━━━━━━━━━
INPUT DATA
━━━━━━━━━━━━━━━━━━━━
{{ JSON.stringify($json.articles) }}

━━━━━━━━━━━━━━━━━━━━
EDITORIAL POLICY
━━━━━━━━━━━━━━━━━━━━

1. AUDIENCE PROFILE
Your readers are technical PMs and Engineering Leaders. They do not care about "AI hype." They care about:
- Building Agentic workflows (LangChain, MCP, AutoGen)
- Reducing inference costs & latency
- Model evaluation & RAG strategies
- Governance & Safety implementation

2. SELECTION CRITERIA (select 8-10 most relevant)
Select ONLY articles that strictly match at least one of these criteria:
- Agentic AI: Multi-agent systems, tool use, orchestration (LangChain, CrewAI).
- LLM Integration: RAG updates, fine-tuning, prompt engineering, context windows.
- Infrastructure: GPU availability, inference optimization, vector DBs, MLOps.
- Strategy: Build vs. buy, open-source vs. closed decisions, API pricing changes.
- Governance: Red teaming, hallucination mitigation, new liability regulations.
- Major Releases: OpenAI, Google, Anthropic, Meta updates that affect roadmaps.

*EXCLUDE:* Lifestyle tech, generic "AI will change the world" op-eds, minor funding rounds, and rumors.

3. DEDUPLICATION
If multiple articles cover the same event, select only the ONE most technical/authoritative source.

4. WRITING STYLE
- Tone: Strictly factual. No marketing language.
- Perspective: Write for a PM making decisions.

5. ALLOWED CATEGORIES (Use only these)
- Agentic AI & Agents
- LLMs & Foundation Models
- AI Product & UX
- AI Safety & Governance
- AI Infrastructure & Tooling
- Regulation & Policy
- Research & Whitepapers

Now analyze the input data and generate the JSON response.`

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get existing config
    const existing = await findIngestionConfig()

    if (existing) {
      await updateIngestionConfig(existing.id, {
        systemPrompt: defaultSystemPrompt,
        userPrompt: defaultUserPrompt,
      })
    } else {
      await upsertIngestionConfig({
        schedule: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        time: "09:00",
        timezone: "America/New_York",
        timeFrame: 72,
        systemPrompt: defaultSystemPrompt,
        userPrompt: defaultUserPrompt,
      })
    }

    await logNewsActivity({
      event: "ingestion.prompts.reset",
      status: "success",
      message: "Ingestion prompts reset to defaults.",
      metadata: { user: session.user?.email },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to reset prompts:", error)
    await logNewsActivity({
      event: "ingestion.prompts.error",
      status: "error",
      message: "Failed to reset ingestion prompts.",
      metadata: { error: String(error) },
    })
    return NextResponse.json(
      { error: "Failed to reset prompts" },
      { status: 500 }
    )
  }
}
