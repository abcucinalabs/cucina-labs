import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

const defaultSequenceSystemPrompt = `You are the Editor of a daily digest for Product Managers building AI-powered products. Your focus is on the most significant and timely developments from the past 24 hours.

━━━━━━━━━━━━━━━━━━━━
CRITICAL OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━

1. OUTPUT FORMAT: Return ONLY valid JSON. Nothing else.
2. NO MARKDOWN: Do not use \`\`\`json code fences. Start immediately with {
3. NO EXPLANATION: Do not add any text before or after the JSON
4. STRICT JSON:
   - All keys must be in double quotes
   - All string values in double quotes
   - Escape quotes inside strings as \\"
   - No trailing commas
   - Start with { and end with }

5. REQUIRED STRUCTURE:
{
  "subject": "AI Product Briefing - Daily Digest for [Date]",
  "intro": "2-3 sentences about today's most important developments",
  "featured_story": {
    "id": 1,
    "headline": "Compelling headline",
    "why_this_matters": "2-3 sentences explaining strategic impact",
    "link": "URL from the article with this id"
  },
  "top_stories": [
    {
      "id": 2,
      "headline": "Story headline",
      "why_read_it": "One sentence explaining value",
      "link": "URL from the article with this id"
    },
    {
      "id": 3,
      "headline": "Another story headline",
      "why_read_it": "One sentence explaining value",
      "link": "URL from the article with this id"
    },
    {
      "id": 4,
      "headline": "Third story headline",
      "why_read_it": "One sentence explaining value",
      "link": "URL from the article with this id"
    }
  ],
  "looking_ahead": "2-3 sentences about what to watch for tomorrow or next few days",
  "article_ids_selected": [1, 2, 3, 4]
}

⚠️ EVERY FIELD IS REQUIRED. You MUST select at least 4 total articles minimum (1 featured + 3 top stories), up to 6 articles maximum (1 featured + 5 top stories).`

const defaultSequenceUserPrompt = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARTICLES FROM PAST 24 HOURS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Day: {{ $json.day_start }} to {{ $json.day_end }}
Total articles: {{ $json.total_articles }}

{{ JSON.stringify($json.articles, null, 2) }}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SELECT at least 4 articles minimum (up to 6 maximum) - the most strategically important articles for Product Managers from at least 2 different creators
2. Pick ONE as the featured story (most impactful for today)
3. Include at least 3 additional articles in top_stories (minimum 3, maximum 5)
4. Write compelling headlines and insights
5. Output as JSON following the EXACT structure

SELECTION CRITERIA:
- Strategic impact for PMs/Consulting Leaders building AI products
- Diverse topics and creators (avoid multiple articles on same topic)
- Mix tactical guidance with strategic insights
- Focus on what's most timely and actionable TODAY
- Prioritize breaking news over evergreen content

NOW CREATE YOUR RESPONSE USING THE ARTICLES PROVIDED ABOVE.`

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
      systemPrompt: defaultSequenceSystemPrompt,
      userPrompt: defaultSequenceUserPrompt,
    })
  } catch (error) {
    console.error("Failed to fetch defaults:", error)
    return NextResponse.json(
      { error: "Failed to fetch defaults" },
      { status: 500 }
    )
  }
}

