import { prisma } from "./db"
import { decryptWithMetadata, encrypt } from "./encryption"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { Resend } from "resend"
import Airtable from "airtable"
import {
  DEFAULT_NEWSLETTER_TEMPLATE,
  buildNewsletterTemplateContext,
  renderNewsletterTemplate,
} from "./newsletter-template"
import { logNewsActivity } from "./news-activity"
import { createShortLink } from "./short-links"
import { computeTimeFrameHours } from "./schedule-rules"
import {
  defaultSequenceSystemPrompt,
  defaultSequenceUserPrompt,
} from "./sequence-prompt-defaults"

// Flexible interface to handle different Gemini response structures
interface NewsletterContent {
  // camelCase format
  featuredStory?: {
    id?: number | string
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
    id?: number | string
    headline?: string
    why_this_matters?: string
    link?: string
  }
  topStories?: Array<{
    id?: number | string
    title?: string
    headline?: string
    summary?: string
    why_read_it?: string
    link?: string
    category?: string
  }>
  top_stories?: Array<{
    id?: number | string
    headline?: string
    why_read_it?: string
    link?: string
  }>
  intro?: string
  lookingAhead?: string
  looking_ahead?: string
  subject?: string
  article_ids_selected?: number[]
}

async function getResendConfig(): Promise<{
  apiKey: string
  fromName: string
  fromEmail: string
} | null> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { service: "resend" },
  })
  if (!apiKey || !apiKey.key) return null
  const { plaintext, needsRotation } = decryptWithMetadata(apiKey.key)
  if (needsRotation) {
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { key: encrypt(plaintext) },
    })
  }
  return {
    apiKey: plaintext,
    fromName: apiKey.resendFromName || "cucina labs",
    fromEmail: apiKey.resendFromEmail || "newsletter@cucinalabs.com",
  }
}

type ResendContact = {
  email?: string
  unsubscribed?: boolean
}

async function fetchResendAudiences(apiKey: string) {
  const response = await fetch("https://api.resend.com/audiences", {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Failed to fetch audiences from Resend:", errorText)
    return []
  }

  const data = await response.json()
  return data?.data || []
}

async function fetchResendAllContactsAudienceId(apiKey: string) {
  const audiences = await fetchResendAudiences(apiKey)
  const allContactsAudience = (audiences || []).find(
    (audience: { name?: string }) =>
      audience.name?.toLowerCase() === "all contacts"
  )
  return allContactsAudience?.id || null
}

async function fetchResendContacts(apiKey: string, audienceId: string) {
  const contacts: ResendContact[] = []
  let cursor: string | null = null
  let hasMore = true

  while (hasMore) {
    const url = new URL(`https://api.resend.com/audiences/${audienceId}/contacts`)
    url.searchParams.set("limit", "100")
    if (cursor) {
      url.searchParams.set("cursor", cursor)
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to fetch contacts from Resend:", errorText)
      break
    }

    const data = await response.json()
    const page = (data?.data || []) as ResendContact[]
    contacts.push(...page)

    cursor =
      data?.next ||
      data?.cursor ||
      data?.pagination?.next ||
      data?.links?.next ||
      null
    hasMore = Boolean(cursor && page.length)
  }

  return contacts
}

async function fetchResendAllContactsFromContactsApi(apiKey: string) {
  const contacts: ResendContact[] = []
  let cursor: string | null = null
  let hasMore = true

  while (hasMore) {
    const url = new URL("https://api.resend.com/contacts")
    url.searchParams.set("limit", "100")
    if (cursor) {
      url.searchParams.set("cursor", cursor)
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to fetch contacts from Resend:", errorText)
      break
    }

    const data = await response.json()
    const page = (data?.data || []) as ResendContact[]
    contacts.push(...page)

    cursor =
      data?.next ||
      data?.cursor ||
      data?.pagination?.next ||
      data?.links?.next ||
      null
    hasMore = Boolean(cursor && page.length)
  }

  return contacts
}

async function fetchResendAllContacts(apiKey: string) {
  const contacts = await fetchResendAllContactsFromContactsApi(apiKey)
  if (contacts.length > 0) {
    return contacts
  }

  const audiences = await fetchResendAudiences(apiKey)
  const allContacts = (
    await Promise.all(
      (audiences || []).map((audience: { id: string }) =>
        fetchResendContacts(apiKey, audience.id)
      )
    )
  ).flat()

  const contactsByEmail = new Map<string, ResendContact>()
  allContacts.forEach((contact) => {
    if (!contact?.email) return
    const email = contact.email.toLowerCase()
    const existing = contactsByEmail.get(email)
    if (!existing) {
      contactsByEmail.set(email, contact)
      return
    }
    contactsByEmail.set(email, {
      email,
      unsubscribed: Boolean(existing.unsubscribed || contact.unsubscribed),
    })
  })

  return Array.from(contactsByEmail.values())
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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
  const { plaintext, needsRotation } = decryptWithMetadata(config.key)
  if (needsRotation) {
    await prisma.apiKey.update({
      where: { id: config.id },
      data: { key: encrypt(plaintext) },
    })
  }
  return {
    apiKey: plaintext,
    baseId,
    tableIdOrName,
  }
}

export async function getRecentArticles(scheduleContext?: { dayOfWeek: string[] }) {
  // Compute lookback hours based on schedule
  const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const currentDay = DAY_NAMES[new Date().getDay()]
  const lookbackHours = scheduleContext?.dayOfWeek?.length
    ? computeTimeFrameHours(scheduleContext.dayOfWeek, currentDay)
    : 24

  // First try to fetch from Airtable
  const airtableConfig = await getAirtableConfig()

  if (airtableConfig) {
    try {
      const articles = await getArticlesFromAirtable(airtableConfig, lookbackHours)
      if (articles.length > 0) {
        return articles
      }
    } catch (error) {
      console.error("Failed to fetch from Airtable, falling back to local DB:", error)
    }
  }

  // Fallback to local database
  const cutoffDate = new Date(Date.now() - lookbackHours * 60 * 60 * 1000)
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

async function getArticlesFromAirtable(config: { apiKey: string; baseId: string; tableIdOrName: string }, lookbackHours: number = 24) {
  const airtable = new Airtable({ apiKey: config.apiKey })
  const base = airtable.base(config.baseId)

  const cutoffDate = new Date(Date.now() - lookbackHours * 60 * 60 * 1000)
  
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
  const { plaintext, needsRotation } = decryptWithMetadata(config.key)
  if (needsRotation) {
    await prisma.apiKey.update({
      where: { id: config.id },
      data: { key: encrypt(plaintext) },
    })
  }
  return {
    apiKey: plaintext,
    model: config.geminiModel || "gemini-1.5-flash",
  }
}

export async function wrapNewsletterWithShortLinks(
  content: NewsletterContent,
  articles: any[],
  sequenceId?: string
): Promise<NewsletterContent> {
  const resolveArticleLink = (article?: any) =>
    article?.source_link || article?.sourceLink || article?.link || ""

  const normalizeTitle = (value?: string) =>
    value ? value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim() : ""

  const findArticleById = (id?: number | string) => {
    if (!id) return null
    const idValue = String(id)
    return (articles || []).find((article) => String(article?.id) === idValue) || null
  }

  const findArticleByTitle = (title?: string) => {
    const normalized = normalizeTitle(title)
    if (!normalized) return null
    return (
      (articles || []).find(
        (article) => normalizeTitle(article?.title) === normalized
      ) || null
    )
  }

  const isShortLink = (value?: string) => {
    if (!value) return false
    try {
      const parsed = new URL(value)
      return parsed.pathname.startsWith("/r/")
    } catch {
      return value.startsWith("/r/")
    }
  }

  const resolveStoryLink = (story?: any) => {
    if (!story) return ""
    if (story.link) return story.link
    if (story.source_link) return story.source_link
    const article = findArticleById(story.id) || findArticleByTitle(story.headline || story.title)
    return resolveArticleLink(article)
  }

  // Create short link for featured story
  if (content.featured_story || content.featuredStory) {
    const featuredStory = content.featured_story || content.featuredStory
    const originalLink = resolveStoryLink(featuredStory)
    const articleId = content.featured_story?.id || content.featuredStory?.id

    if (originalLink) {
      const shortLink = isShortLink(originalLink)
        ? originalLink
        : await createShortLink(
            originalLink,
            articleId ? String(articleId) : null,
            sequenceId || null
          )

      if (content.featured_story) {
        content.featured_story.link = shortLink
      }
      if (content.featuredStory) {
        content.featuredStory.link = shortLink
      }
    }
  }

  // Create short links for top stories
  const topStories = content.top_stories || content.topStories || []
  for (let i = 0; i < topStories.length; i++) {
    const story = topStories[i]
    if (!story) continue
    const originalLink = resolveStoryLink(story)
    if (originalLink) {
      const shortLink = isShortLink(originalLink)
        ? originalLink
        : await createShortLink(
            originalLink,
            story.id ? String(story.id) : null,
            sequenceId || null
          )
      story.link = shortLink
    }
  }

  return content
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
    console.log("Featured story link:", parsed.featured_story?.link || parsed.featuredStory?.link || "MISSING")
    console.log("Top stories links:", (parsed.top_stories || parsed.topStories || []).map((s: any) => s.link || "MISSING"))
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
  const highlightItems = [
    featuredTitle ? `- ${featuredTitle}${featuredSummary ? ` — ${featuredSummary}` : ""}` : "",
    ...stories.slice(0, 3).map((story: any) => {
      const storyTitle = story.title || story.headline || ""
      const storySummary = story.summary || story.why_read_it || ""
      return storyTitle ? `- ${storyTitle}${storySummary ? ` — ${storySummary}` : ""}` : ""
    }),
  ].filter(Boolean)
  
  return `
CUCINA LABS - AI Product Newsletter

${intro}

${highlightItems.length ? `HIGHLIGHTS
${highlightItems.join("\n")}` : ""}

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

export async function runDistribution(sequenceId: string, options: { skipArticleCheck?: boolean } = {}): Promise<void> {
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

  if (!sequence.audienceId) {
    await logNewsActivity({
      event: "distribution_failed",
      status: "error",
      message: `Sequence is missing audience ID: ${sequence.name}`,
      metadata: { sequenceId, sequenceName: sequence.name },
    })
    throw new Error("Sequence audience ID not configured")
  }

  // Get recent articles with schedule-aware lookback
  const articles = await getRecentArticles({ dayOfWeek: sequence.dayOfWeek })

  if (articles.length === 0 && !options.skipArticleCheck) {
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

  // Load prompts: sequence-level overrides → global config → hardcoded defaults
  let systemPrompt = sequence.systemPrompt || ""
  let userPrompt = sequence.userPrompt || ""

  if (!systemPrompt || !userPrompt) {
    const globalConfig = await prisma.sequencePromptConfig.findFirst()
    if (!systemPrompt) {
      systemPrompt = globalConfig?.systemPrompt || defaultSequenceSystemPrompt
    }
    if (!userPrompt) {
      userPrompt = globalConfig?.userPrompt || defaultSequenceUserPrompt
    }
  }

  // Generate newsletter content
  let content = await generateNewsletterContent(
    articles,
    systemPrompt,
    userPrompt
  )

  await logNewsActivity({
    event: "distribution_content_generated",
    status: "success",
    message: `Newsletter content generated for sequence: ${sequence.name}`,
    metadata: { sequenceId, sequenceName: sequence.name },
  })

  // Wrap URLs with branded short links
  content = await wrapNewsletterWithShortLinks(content, articles, sequenceId)

  // Fetch the template if specified
  let template: string | undefined
  if (sequence.templateId) {
    const newsletterTemplate = await prisma.newsletterTemplate.findUnique({
      where: { id: sequence.templateId },
    })
    if (newsletterTemplate) {
      template = newsletterTemplate.html
    }
  } else {
    const defaultTemplate = await prisma.newsletterTemplate.findFirst({
      where: { isDefault: true },
      orderBy: { updatedAt: "desc" },
    })
    if (defaultTemplate) {
      template = defaultTemplate.html
    }
  }

  // Generate email HTML and plain text
  const html = generateEmailHtml(content, { articles, origin: process.env.NEXTAUTH_URL || "", template })
  const plainText = generatePlainText(content)

  // Get Resend API key
  const resendConfig = await getResendConfig()
  if (!resendConfig) {
    await logNewsActivity({
      event: "distribution_failed",
      status: "error",
      message: `Resend API key not configured for sequence: ${sequence.name}`,
      metadata: { sequenceId, sequenceName: sequence.name },
    })
    throw new Error("Resend API key not configured")
  }

  const resend = new Resend(resendConfig.apiKey)
  const from = `${resendConfig.fromName} <${resendConfig.fromEmail}>`

  await logNewsActivity({
    event: "distribution_sending",
    status: "info",
    message: `Sending newsletter broadcast for sequence: ${sequence.name}`,
    metadata: {
      sequenceId,
      sequenceName: sequence.name,
      audienceId: sequence.audienceId,
    },
  })

  const useAllSubscribers =
    sequence.audienceId === "resend_all" || sequence.audienceId === "local_all"
  const allContactsAudienceId = useAllSubscribers
    ? await fetchResendAllContactsAudienceId(resendConfig.apiKey)
    : null

  // Handle all Resend subscribers vs a specific Resend audience
  if (useAllSubscribers && !allContactsAudienceId) {
    const contacts = await fetchResendAllContacts(resendConfig.apiKey)
    const activeContacts = contacts.filter((contact) => contact.email && !contact.unsubscribed)

    if (activeContacts.length === 0) {
      await logNewsActivity({
        event: "distribution_skipped",
        status: "warning",
        message: `No active Resend subscribers for sequence: ${sequence.name}`,
        metadata: { sequenceId, sequenceName: sequence.name },
      })
      console.log("No active Resend subscribers to send to")
      return
    }

    await logNewsActivity({
      event: "distribution_sending_batch",
      status: "info",
      message: `Sending to ${activeContacts.length} Resend subscribers for sequence: ${sequence.name}`,
      metadata: { sequenceId, sequenceName: sequence.name, subscriberCount: activeContacts.length },
    })

    // Send batch emails using Resend batch API (max 100 per batch)
    const batchSize = 100
    let totalSent = 0
    let totalFailed = 0

    for (let i = 0; i < activeContacts.length; i += batchSize) {
      const batch = activeContacts.slice(i, i + batchSize)
      const emails = batch.map((contact) => ({
        from,
        to: contact.email as string,
        subject: content.subject || sequence.name,
        html,
        text: plainText,
      }))

      let attempts = 0
      let sent = false
      while (attempts < 3 && !sent) {
        attempts += 1
        try {
          const batchResponse = await resend.batch.send(emails)
          if (batchResponse.error) {
            console.error("Batch send error:", batchResponse.error)
            if (batchResponse.error?.name === "rate_limit_exceeded") {
              await sleep(1000 * attempts)
              continue
            }
            totalFailed += batch.length
            break
          } else {
            totalSent += batch.length
            sent = true
          }
        } catch (error) {
          console.error("Batch send exception:", error)
          await sleep(1000 * attempts)
        }
      }

      if (!sent && attempts >= 3) {
        totalFailed += batch.length
      }

      await sleep(600)
    }

    await logNewsActivity({
      event: "distribution_completed",
      status: totalFailed === 0 ? "success" : "warning",
      message: `Batch emails sent for sequence: ${sequence.name} (${totalSent} sent, ${totalFailed} failed)`,
      metadata: {
        sequenceId,
        sequenceName: sequence.name,
        totalSent,
        totalFailed,
        totalSubscribers: activeContacts.length,
      },
    })
  } else {
    const audienceId = useAllSubscribers ? allContactsAudienceId : sequence.audienceId
    // Use Resend broadcast for Resend audiences
    const broadcastResponse = await resend.broadcasts.create({
      name: `${sequence.name} - ${new Date().toISOString()}`,
      audienceId: audienceId as string,
      from,
      subject: content.subject || sequence.name,
      html,
      text: plainText,
      previewText: content.intro || undefined,
    })

    if (broadcastResponse.error || !broadcastResponse.data?.id) {
      await logNewsActivity({
        event: "distribution_failed",
        status: "error",
        message: `Failed to create broadcast for sequence: ${sequence.name}`,
        metadata: {
          sequenceId,
          sequenceName: sequence.name,
          audienceId,
          error: broadcastResponse.error?.message || JSON.stringify(broadcastResponse.error),
        },
      })
      throw new Error(
        `Failed to create Resend broadcast: ${broadcastResponse.error?.message || "unknown error"}`
      )
    }

    const broadcastId = broadcastResponse.data.id

    const sendResponse = await resend.broadcasts.send(broadcastId)
    if (sendResponse.error) {
      await logNewsActivity({
        event: "distribution_failed",
        status: "error",
        message: `Failed to send broadcast for sequence: ${sequence.name}`,
        metadata: {
          sequenceId,
          sequenceName: sequence.name,
          audienceId,
          broadcastId,
          error: sendResponse.error?.message || JSON.stringify(sendResponse.error),
        },
      })
      throw new Error(
        `Failed to send Resend broadcast: ${sendResponse.error?.message || "unknown error"}`
      )
    }

    await logNewsActivity({
      event: "distribution_completed",
      status: "success",
      message: `Broadcast sent for sequence: ${sequence.name}`,
      metadata: {
        sequenceId,
        sequenceName: sequence.name,
        audienceId,
        broadcastId,
      },
    })
  }

  // Update sequence last sent time
  await prisma.sequence.update({
    where: { id: sequenceId },
    data: { lastSent: new Date() },
  })
}
