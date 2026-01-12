import { prisma } from "./db"
import { decrypt } from "./encryption"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { Resend } from "resend"
import Airtable from "airtable"
import {
  DEFAULT_NEWSLETTER_TEMPLATE,
  buildNewsletterTemplateContext,
  renderNewsletterTemplate,
} from "./newsletter-template"
import { logNewsActivity } from "./news-activity"

// Flexible interface to handle different Gemini response structures
interface NewsletterContent {
  // camelCase format
  featuredStory?: {
    title?: string
    headline?: string
    summary?: string
    why_this_matters?: string
    link?: string
    imageUrl?: string
    image_url?: string
    category?: string
  }
  // snake_case format (from prompts)
  featured_story?: {
    id?: number
    headline?: string
    why_this_matters?: string
  }
  topStories?: Array<{
    title?: string
    headline?: string
    summary?: string
    why_read_it?: string
    link?: string
    category?: string
  }>
  top_stories?: Array<{
    id?: number
    headline?: string
    why_read_it?: string
  }>
  intro?: string
  lookingAhead?: string
  looking_ahead?: string
  subject?: string
  article_ids_selected?: number[]
}

async function getResendApiKey(): Promise<string | null> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { service: "resend" },
  })
  if (!apiKey || !apiKey.key) return null
  return decrypt(apiKey.key)
}

async function getAirtableConfig(): Promise<{
  apiKey: string
  baseId: string
  tableIdOrName: string
} | null> {
  const config = await prisma.apiKey.findUnique({
    where: { service: "airtable" },
  })
  const baseId = config?.airtableBaseId || process.env.AIRTABLE_BASE_ID
  const tableIdOrName =
    config?.airtableTableId ||
    config?.airtableTableName ||
    process.env.AIRTABLE_TABLE_ID ||
    process.env.AIRTABLE_TABLE_NAME

  if (!config || !config.key || !baseId || !tableIdOrName) {
    return null
  }
  return {
    apiKey: decrypt(config.key),
    baseId,
    tableIdOrName,
  }
}

export async function getRecentArticles() {
  // First try to fetch from Airtable
  const airtableConfig = await getAirtableConfig()
  
  if (airtableConfig) {
    try {
      const articles = await getArticlesFromAirtable(airtableConfig)
      if (articles.length > 0) {
        return articles
      }
    } catch (error) {
      console.error("Failed to fetch from Airtable, falling back to local DB:", error)
    }
  }

  // Fallback to local database
  const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const articles = await prisma.article.findMany({
    where: {
      ingestedAt: { gte: cutoffDate },
      isRecent: true,
    },
    orderBy: {
      publishedDate: "desc",
    },
    take: 20,
  })

  return articles.map((article) => ({
    id: article.id,
    title: article.title,
    summary: article.aiSummary || "",
    link: article.sourceLink,
    imageUrl: article.imageLink || "",
    category: article.category,
    whyItMatters: article.whyItMatters || "",
    businessValue: article.businessValue || "",
    creator: article.creator || "",
  }))
}

async function getArticlesFromAirtable(config: { apiKey: string; baseId: string; tableIdOrName: string }) {
  const airtable = new Airtable({ apiKey: config.apiKey })
  const base = airtable.base(config.baseId)
  
  // Get articles from the last 24 hours
  const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  const records = await base(config.tableIdOrName)
    .select({
      maxRecords: 20,
      sort: [{ field: "published_date", direction: "desc" }],
      // Filter for recent articles - adjust field names based on your Airtable schema
      filterByFormula: `IS_AFTER({published_date}, '${cutoffDate.toISOString().split('T')[0]}')`,
    })
    .all()

  return records.map((record) => ({
    id: record.id,
    title: record.get("title") as string || "",
    summary: record.get("ai_generated_summary") as string || "",
    link: record.get("source_link") as string || "",
    imageUrl: record.get("image_link") as string || "",
    category: record.get("category") as string || "",
    whyItMatters: record.get("why_it_matters") as string || "",
    businessValue: record.get("business_value") as string || "",
    creator: record.get("creator") as string || "",
  }))
}

// Export for use in preview when no filter is needed
export async function getAllArticlesFromAirtable(limit: number = 20) {
  const airtableConfig = await getAirtableConfig()
  
  if (!airtableConfig) {
    throw new Error("Airtable not configured. Please set up Airtable integration first.")
  }

  const airtable = new Airtable({ apiKey: airtableConfig.apiKey })
  const base = airtable.base(airtableConfig.baseId)
  
  const records = await base(airtableConfig.tableIdOrName)
    .select({
      maxRecords: limit,
      sort: [{ field: "published_date", direction: "desc" }],
    })
    .all()

  return records.map((record) => ({
    id: record.id,
    title: record.get("title") as string || "",
    summary: record.get("ai_generated_summary") as string || "",
    link: record.get("source_link") as string || "",
    imageUrl: record.get("image_link") as string || "",
    category: record.get("category") as string || "",
    whyItMatters: record.get("why_it_matters") as string || "",
    businessValue: record.get("business_value") as string || "",
    creator: record.get("creator") as string || "",
  }))
}

async function getGeminiConfig(): Promise<{ apiKey: string; model: string } | null> {
  const config = await prisma.apiKey.findUnique({
    where: { service: "gemini" },
  })
  if (!config || !config.key) return null
  return {
    apiKey: decrypt(config.key),
    model: config.geminiModel || "gemini-1.5-flash",
  }
}

export async function generateNewsletterContent(
  articles: any[],
  systemPrompt: string,
  userPrompt: string
): Promise<NewsletterContent> {
  const geminiConfig = await getGeminiConfig()
  if (!geminiConfig) {
    throw new Error("Gemini API key not configured")
  }

  console.log("Using Gemini model:", geminiConfig.model)
  
  const genAI = new GoogleGenerativeAI(geminiConfig.apiKey)
  const model = genAI.getGenerativeModel({ model: geminiConfig.model })

  // Use custom prompts if provided, otherwise use a default prompt
  let prompt: string
  if (systemPrompt || userPrompt) {
    // Replace template placeholders with actual data
    const processedUserPrompt = userPrompt
      .replace(/\{\{\s*\$json\.articles\s*\}\}/g, JSON.stringify(articles, null, 2))
      .replace(/\{\{\s*JSON\.stringify\(\$json\.articles[^}]*\}\}/g, JSON.stringify(articles, null, 2))
      .replace(/\{\{\s*\$json\.day_start\s*\}\}/g, new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .replace(/\{\{\s*\$json\.day_end\s*\}\}/g, new Date().toISOString())
      .replace(/\{\{\s*\$json\.total_articles\s*\}\}/g, String(articles.length))
    
    prompt = `${systemPrompt ? systemPrompt + "\n\n" : ""}${processedUserPrompt}`
  } else {
    prompt = `Generate a newsletter from these articles:\n\n${JSON.stringify(articles, null, 2)}\n\nReturn a JSON object with: featuredStory (title, summary, link, imageUrl, category), topStories (array of 3-4 items with title, summary, link, category), intro (string), lookingAhead (string).`
  }

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log("Gemini raw response:", text.substring(0, 500) + "...")

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("Failed to parse JSON from Gemini response:", text)
      throw new Error("Failed to parse Gemini response")
    }

    const parsed = JSON.parse(jsonMatch[0])
    console.log("Parsed Gemini response keys:", Object.keys(parsed))
    return parsed
  } catch (error) {
    console.error("Gemini API error:", error)
    throw error
  }
}

export function generateEmailHtml(
  content: NewsletterContent,
  options?: { articles?: any[]; origin?: string; template?: string }
): string {
  const template = options?.template || DEFAULT_NEWSLETTER_TEMPLATE
  const context = buildNewsletterTemplateContext({
    content,
    articles: options?.articles || [],
    origin: options?.origin || "",
  })
  return renderNewsletterTemplate(template, context)
}

export function generatePlainText(content: NewsletterContent): string {
  // Handle different response structures from Gemini
  const featured = content.featuredStory || content.featured_story || {} as any
  const stories = content.topStories || content.top_stories || []
  const intro = content.intro || ""
  const lookingAhead = content.lookingAhead || content.looking_ahead || ""
  
  const featuredCategory = featured.category || ""
  const featuredTitle = featured.title || featured.headline || ""
  const featuredSummary = featured.summary || featured.why_this_matters || ""
  const featuredLink = featured.link || ""
  
  return `
CUCINA LABS - AI Product Newsletter

${intro}

${featuredTitle ? `FEATURED STORY
${featuredCategory ? featuredCategory.toUpperCase() + "\n" : ""}${featuredTitle}
${featuredSummary}
${featuredLink ? "Read more: " + featuredLink : ""}` : ""}

TOP STORIES
${stories.map((story: any) => {
  const storyCategory = story.category || ""
  const storyTitle = story.title || story.headline || ""
  const storySummary = story.summary || story.why_read_it || ""
  const storyLink = story.link || ""
  return `${storyCategory ? storyCategory.toUpperCase() + "\n" : ""}${storyTitle}
${storySummary}
${storyLink ? "Read more: " + storyLink : ""}`
}).join("\n\n")}

${lookingAhead ? `LOOKING AHEAD
${lookingAhead}` : ""}

---
© ${new Date().getFullYear()} cucina labs
Unsubscribe: ${process.env.NEXTAUTH_URL}/unsubscribe
  `.trim()
}

export async function runDistribution(sequenceId: string): Promise<void> {
  const sequence = await prisma.sequence.findUnique({
    where: { id: sequenceId },
  })

  if (!sequence || sequence.status !== "active") {
    await logNewsActivity({
      event: "distribution_failed",
      status: "error",
      message: `Sequence not found or not active: ${sequenceId}`,
      metadata: { sequenceId },
    })
    throw new Error("Sequence not found or not active")
  }

  await logNewsActivity({
    event: "distribution_started",
    status: "info",
    message: `Starting distribution for sequence: ${sequence.name}`,
    metadata: { sequenceId, sequenceName: sequence.name },
  })

  // Get recent articles
  const articles = await getRecentArticles()

  if (articles.length === 0) {
    await logNewsActivity({
      event: "distribution_skipped",
      status: "warning",
      message: `No recent articles to send for sequence: ${sequence.name}`,
      metadata: { sequenceId, sequenceName: sequence.name },
    })
    console.log("No recent articles to send")
    return
  }

  await logNewsActivity({
    event: "distribution_articles_fetched",
    status: "info",
    message: `Fetched ${articles.length} articles for sequence: ${sequence.name}`,
    metadata: { sequenceId, sequenceName: sequence.name, articleCount: articles.length },
  })

  // Generate newsletter content
  const content = await generateNewsletterContent(
    articles,
    sequence.systemPrompt || "",
    sequence.userPrompt
  )

  await logNewsActivity({
    event: "distribution_content_generated",
    status: "success",
    message: `Newsletter content generated for sequence: ${sequence.name}`,
    metadata: { sequenceId, sequenceName: sequence.name },
  })

  // Generate email HTML and plain text
  const html = generateEmailHtml(content, { articles, origin: process.env.NEXTAUTH_URL || "" })
  const plainText = generatePlainText(content)

  // Get Resend API key
  const resendApiKey = await getResendApiKey()
  if (!resendApiKey) {
    await logNewsActivity({
      event: "distribution_failed",
      status: "error",
      message: `Resend API key not configured for sequence: ${sequence.name}`,
      metadata: { sequenceId, sequenceName: sequence.name },
    })
    throw new Error("Resend API key not configured")
  }

  const resend = new Resend(resendApiKey)

  // Get subscribers
  const subscribers = await prisma.subscriber.findMany({
    where: { status: "active" },
  })

  await logNewsActivity({
    event: "distribution_sending",
    status: "info",
    message: `Sending newsletter to ${subscribers.length} subscribers for sequence: ${sequence.name}`,
    metadata: { sequenceId, sequenceName: sequence.name, subscriberCount: subscribers.length },
  })

  // Track email send results
  let successCount = 0
  let failureCount = 0
  const errors: string[] = []

  // Send emails
  for (const subscriber of subscribers) {
    try {
      // Generate unsubscribe token with expiration (valid for 90 days)
      const crypto = await import("crypto")
      const normalizedEmail = subscriber.email.trim().toLowerCase()
      const expirationDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      const timestamp = Math.floor(expirationDate.getTime() / 1000)

      // Use UNSUBSCRIBE_SECRET if available, fallback to NEXTAUTH_SECRET
      const secret = process.env.UNSUBSCRIBE_SECRET || process.env.NEXTAUTH_SECRET || ""

      // Include email and timestamp in token payload for expiration
      const payload = `${normalizedEmail}:${timestamp}`
      const token = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex")

      const unsubscribeUrl = `${process.env.NEXTAUTH_URL}/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${token}&exp=${timestamp}`
      const htmlWithUnsubscribe = html
        .replace(/\{\{email\}\}/g, subscriber.email)
        .replace(/\{\{token\}\}/g, token)
        .replace(/\{\{exp\}\}/g, String(timestamp))

      await resend.emails.send({
        from: "cucina labs <newsletter@cucinalabs.com>",
        to: subscriber.email,
        subject: sequence.name,
        html: htmlWithUnsubscribe,
        text: plainText,
      })
      successCount++
    } catch (error) {
      failureCount++
      const errorMsg = error instanceof Error ? error.message : String(error)
      errors.push(`${subscriber.email}: ${errorMsg}`)
      console.error(`Failed to send email to ${subscriber.email}:`, error)
    }
  }

  // Log distribution results
  if (failureCount === 0) {
    await logNewsActivity({
      event: "distribution_completed",
      status: "success",
      message: `Successfully sent newsletter to all ${successCount} subscribers for sequence: ${sequence.name}`,
      metadata: {
        sequenceId,
        sequenceName: sequence.name,
        successCount,
        failureCount: 0,
        totalSubscribers: subscribers.length,
      },
    })
  } else if (successCount > 0) {
    await logNewsActivity({
      event: "distribution_completed_with_errors",
      status: "warning",
      message: `Newsletter sent to ${successCount} subscribers with ${failureCount} failures for sequence: ${sequence.name}`,
      metadata: {
        sequenceId,
        sequenceName: sequence.name,
        successCount,
        failureCount,
        totalSubscribers: subscribers.length,
        errors: errors.slice(0, 10), // Only log first 10 errors
      },
    })
  } else {
    await logNewsActivity({
      event: "distribution_failed",
      status: "error",
      message: `Failed to send newsletter to all ${failureCount} subscribers for sequence: ${sequence.name}`,
      metadata: {
        sequenceId,
        sequenceName: sequence.name,
        successCount: 0,
        failureCount,
        totalSubscribers: subscribers.length,
        errors: errors.slice(0, 10), // Only log first 10 errors
      },
    })
  }

  // Update sequence last sent time
  await prisma.sequence.update({
    where: { id: sequenceId },
    data: { lastSent: new Date() },
  })
}
