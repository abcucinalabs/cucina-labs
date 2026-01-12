import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultRssFeeds = [
  {
    name: "Lenny's Newsletter",
    url: "https://lennysnewsletter.com/feed",
    enabled: true,
    category: "AI Product Strategy",
    isDefault: true
  },
  {
    name: "Dan Rose AI",
    url: "https://danrose.ai/blog?format=rss",
    enabled: true,
    category: "AI Product Strategy",
    isDefault: true
  },
  {
    name: "VentureBeat AI",
    url: "https://venturebeat.com/category/ai/feed/",
    enabled: true,
    category: "AI News",
    isDefault: true
  },
  {
    name: "AI TechPark",
    url: "https://ai-techpark.com/category/ai/feed/",
    enabled: true,
    category: "AI Infrastructure",
    isDefault: true
  },
  {
    name: "Bloomberg Technology",
    url: "https://feeds.bloomberg.com/technology/news.rss",
    enabled: true,
    category: "Tech News",
    isDefault: true
  },
  {
    name: "AI News",
    url: "https://www.artificialintelligence-news.com/feed/",
    enabled: true,
    category: "AI News",
    isDefault: true
  },
  {
    name: "Google Research",
    url: "https://research.google/blog/rss/",
    enabled: true,
    category: "Research",
    isDefault: true
  },
  {
    name: "MIT AI News",
    url: "https://news.mit.edu/rss/topic/artificial-intelligence2",
    enabled: true,
    category: "Research",
    isDefault: true
  },
  {
    name: "OpenAI Blog",
    url: "https://openai.com/news/rss.xml",
    enabled: true,
    category: "LLMs & Foundation Models",
    isDefault: true
  },
  {
    name: "AI Trends",
    url: "https://www.aitrends.com/feed/",
    enabled: true,
    category: "AI News",
    isDefault: true
  }
]

const defaultIngestionSystemPrompt = `You are the Editor of a daily technical briefing for Product Managers building AI-powered products.

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

const defaultIngestionUserPrompt = `━━━━━━━━━━━━━━━━━━━━
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
    "why_this_matters": "2-3 sentences explaining strategic impact"
  },
  "top_stories": [
    {
      "id": 2,
      "headline": "Story headline",
      "why_read_it": "One sentence explaining value"
    }
  ],
  "looking_ahead": "2-3 sentences about what to watch for tomorrow or next few days",
  "article_ids_selected": [1, 2, 3, 4]
}

⚠️ EVERY FIELD IS REQUIRED. Select 3-5 total articles (1 featured + 2-4 top stories).`

const defaultSequenceUserPrompt = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARTICLES FROM PAST 24 HOURS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Day: {{ $json.day_start }} to {{ $json.day_end }}
Total articles: {{ $json.total_articles }}

{{ JSON.stringify($json.articles, null, 2) }}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SELECT 3-5 most strategically important articles for Product Managers from at least 2 different creators
2. Pick ONE as the featured story (most impactful for today)
3. Write compelling headlines and insights
4. Output as JSON following the EXACT structure

SELECTION CRITERIA:
- Strategic impact for PMs/Consulting Leaders building AI products
- Diverse topics and creators (avoid multiple articles on same topic)
- Mix tactical guidance with strategic insights
- Focus on what's most timely and actionable TODAY
- Prioritize breaking news over evergreen content

NOW CREATE YOUR RESPONSE USING THE ARTICLES PROVIDED ABOVE.`

const welcomeEmailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to AI Product Briefing</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.7; color: #0d0d0d; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
        <![endif]-->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border-radius: 20px; border: 1px solid rgba(0, 0, 0, 0.06); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); overflow: hidden;">
                <tr>
                  <td bgcolor="#0d0d0d" background="https://cucina-labs.com/video-background-2-still.png" style="background-color: #0d0d0d; background-image: url('https://cucina-labs.com/video-background-2-still.png'); background-size: cover; background-position: center; background-repeat: no-repeat; border-radius: 20px 20px 0 0;">
                    <!--[if gte mso 9]>
                    <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:220px;">
                      <v:fill type="frame" src="https://cucina-labs.com/video-background-2-still.png" color="#0d0d0d" />
                      <v:textbox inset="0,0,0,0">
                    <![endif]-->
                    <div>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td bgcolor="#0d0d0d" style="padding: 32px 40px 36px; background-color: rgba(13, 13, 13, 0.55);">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td align="left" style="font-size: 11px; font-weight: 600; color: #9bf2ca; text-transform: uppercase; letter-spacing: 0.1em;">
                                  Cucina Labs
                                </td>
                                <td align="right" style="font-size: 12px; color: rgba(255, 255, 255, 0.7);">
                                  Welcome Edition
                                </td>
                              </tr>
                            </table>
                            <p style="margin: 20px 0 10px; font-size: 11px; font-weight: 600; color: #9bf2ca; text-transform: uppercase; letter-spacing: 0.1em;">AI Product Briefing</p>
                            <h1 style="margin: 0; color: #ffffff; font-size: 34px; font-weight: 600; letter-spacing: -0.03em; line-height: 1.15;">Welcome to Cucina Labs</h1>
                          </td>
                        </tr>
                      </table>
                    </div>
                    <!--[if gte mso 9]>
                      </v:textbox>
                    </v:rect>
                    <![endif]-->
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 36px 40px 40px;">
                    <p style="margin: 0 0 12px 0; font-size: 15px; color: rgba(13, 13, 13, 0.7); line-height: 1.7;">
                      Your daily intelligence on AI product development.
                    </p>
                    <p style="margin: 0 0 18px 0; font-size: 16px; color: #0d0d0d; line-height: 1.6; font-weight: 600;">
                      Hi there! 👋
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 15px; color: rgba(13, 13, 13, 0.7); line-height: 1.7;">
                      Thanks for joining the AI Product Briefing community. Every morning, we'll send you a curated digest of the most important AI developments that matter to Product Managers and Engineering Leaders.
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0;">
                      <tr>
                        <td style="padding: 24px; background: #fafafa; border: 1px solid rgba(0, 0, 0, 0.06); border-left: 3px solid #9bf2ca; border-radius: 16px;">
                          <p style="margin: 0 0 12px; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #4a51d9;">What to expect</p>
                          <ul style="margin: 0; padding-left: 20px; font-size: 15px; color: rgba(13, 13, 13, 0.7); line-height: 1.7;">
                            <li style="margin: 0 0 10px;">Breaking news on LLMs, agentic AI, and AI infrastructure</li>
                            <li style="margin: 0 0 10px;">Strategic insights on build vs. buy decisions</li>
                            <li style="margin: 0 0 10px;">Technical deep-dives on RAG, fine-tuning, and model evaluation</li>
                            <li style="margin: 0;">Governance and safety updates that affect your roadmap</li>
                          </ul>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 0 0 32px 0; font-size: 15px; color: rgba(13, 13, 13, 0.7); line-height: 1.7;">
                      Your first briefing arrives tomorrow morning. We can't wait to help you stay ahead.
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: #9bf2ca; border-radius: 10px; text-align: center;">
                          <a href="https://cucina-labs.com" style="display: inline-block; padding: 14px 32px; color: #0d0d0d; text-decoration: none; font-weight: 600; font-size: 14px;">Visit Cucina Labs</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px 36px; text-align: center;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.08), transparent); margin: 0 0 20px;"></div>
                    <p style="margin: 0 0 10px; color: rgba(13, 13, 13, 0.5); font-size: 12px;">You are receiving this because you subscribed to Cucina Labs.</p>
                    <a href="{{unsubscribe_url}}" style="color: #3c35f2; text-decoration: none; font-weight: 600; font-size: 12px;">Unsubscribe</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <!--[if mso]>
            </td>
          </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`

async function main() {
  console.log('🌱 Seeding database...')

  // Seed default RSS feeds
  console.log('📰 Seeding RSS feeds...')
  for (const feed of defaultRssFeeds) {
    await prisma.rssSource.upsert({
      where: { url: feed.url },
      update: { category: feed.category, isDefault: feed.isDefault },
      create: feed
    })
  }
  console.log(`✅ Seeded ${defaultRssFeeds.length} RSS feeds`)

  // Seed default ingestion config
  console.log('⚙️ Seeding ingestion config...')
  const existingConfig = await prisma.ingestionConfig.findFirst()
  if (!existingConfig) {
    await prisma.ingestionConfig.create({
      data: {
        schedule: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        time: '09:00',
        timezone: 'America/New_York',
        timeFrame: 72,
        systemPrompt: defaultIngestionSystemPrompt,
        userPrompt: defaultIngestionUserPrompt
      }
    })
    console.log('✅ Seeded ingestion config')
  } else {
    console.log('⏭️ Ingestion config already exists, skipping')
  }

  // Seed default email templates
  console.log('📧 Seeding email templates...')
  await prisma.emailTemplate.upsert({
    where: { type: 'welcome' },
    update: {
      subject: 'Welcome to cucina labs!',
      html: welcomeEmailHtml,
    },
    create: {
      type: 'welcome',
      subject: 'Welcome to cucina labs!',
      html: welcomeEmailHtml,
      enabled: true
    }
  })
  console.log('✅ Seeded email templates')

  console.log('🎉 Database seeding complete!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
