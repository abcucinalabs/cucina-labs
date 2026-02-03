import {
  findApiKeyByService,
  findRecentArticles,
  findSequenceById,
  updateSequence,
  findSequencePromptConfig,
  findNewsletterTemplateById,
  findDefaultNewsletterTemplate,
  findSavedContent,
} from "./dal"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { Resend } from "resend"
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
import { getServiceApiKey } from "./service-keys"
import { normalizeGeminiModel } from "./gemini-model"

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
  from_chefs_table?: {
    title?: string
    body?: string
  }
  news?: Array<{
    id?: number | string
    headline?: string
    why_this_matters?: string
    source?: string
    link?: string
    url?: string
  }>
  what_were_reading?: Array<{
    title?: string
    description?: string
    summary?: string
    url?: string
    link?: string
  }>
  what_were_cooking?: {
    title?: string
    description?: string
    url?: string
    link?: string
  }
}

type SavedPromptReadingItem = {
  title: string
  url: string
  description: string
  source?: string
  createdAt?: string
}

type SavedPromptCookingItem = {
  title: string
  url: string
  description: string
  createdAt?: string
}

async function getResendConfig(): Promise<{
  apiKey: string
  fromName: string
  fromEmail: string
} | null> {
  const apiKeyRecord = await findApiKeyByService("resend")
  const plaintext = await getServiceApiKey("resend")
  if (!plaintext) return null
  return {
    apiKey: plaintext,
    fromName: apiKeyRecord?.resendFromName || "cucina labs",
    fromEmail: apiKeyRecord?.resendFromEmail || "newsletter@cucinalabs.com",
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

export async function getRecentArticles(scheduleContext?: { dayOfWeek: string[] }) {
  // Compute lookback hours based on schedule
  const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const currentDay = DAY_NAMES[new Date().getDay()]
  const lookbackHours = scheduleContext?.dayOfWeek?.length
    ? computeTimeFrameHours(scheduleContext.dayOfWeek, currentDay)
    : 24

  const cutoffDate = new Date(Date.now() - lookbackHours * 60 * 60 * 1000)
  const articles = await findRecentArticles(cutoffDate)

  return articles.map((article: any) => ({
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

async function getSavedWeeklyPromptData(options?: {
  readingItems?: SavedPromptReadingItem[]
  cookingItem?: SavedPromptCookingItem | null
}) {
  if (options?.readingItems && options?.cookingItem !== undefined) {
    return {
      readingItems: options.readingItems,
      cookingItem: options.cookingItem,
    }
  }

  const [savedReading, savedCooking] = await Promise.all([
    findSavedContent({ type: "reading" }).catch(() => []),
    findSavedContent({ type: "cooking" }).catch(() => []),
  ])

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const sortDesc = (a: any, b: any) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()

  const readingItems = (savedReading || [])
    .filter((item: any) => {
      if (!item?.createdAt) return false
      return new Date(item.createdAt).getTime() >= sevenDaysAgo
    })
    .sort(sortDesc)
    .slice(0, 5)
    .map((item: any) => ({
      title: item.title || "",
      url: item.url || "",
      description: item.description || "",
      source: item.source || "",
      createdAt: item.createdAt,
    }))

  const latestCooking = (savedCooking || [])
    .sort(sortDesc)
    .slice(0, 1)
    .map((item: any) => ({
      title: item.title || "",
      url: item.url || "",
      description: item.description || "",
      createdAt: item.createdAt,
    }))[0] || null

  return {
    readingItems,
    cookingItem: latestCooking,
  }
}

async function getGeminiConfig(): Promise<{ apiKey: string; model: string } | null> {
  const config = await findApiKeyByService("gemini")
  const plaintext = await getServiceApiKey("gemini")
  if (!plaintext) return null
  return {
    apiKey: plaintext,
    model: normalizeGeminiModel(config?.geminiModel),
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

  // Weekly prompt support: create short links for weekly news
  const weeklyNews = content.news || []
  for (let i = 0; i < weeklyNews.length; i++) {
    const story = weeklyNews[i]
    if (!story) continue
    const originalLink = story.link || story.url || ""
    if (!originalLink) continue
    const shortLink = isShortLink(originalLink)
      ? originalLink
      : await createShortLink(
          originalLink,
          story.id ? String(story.id) : null,
          sequenceId || null
        )
    story.link = shortLink
  }

  // Weekly prompt support: create short links for reading and cooking links
  const weeklyReading = content.what_were_reading || []
  for (let i = 0; i < weeklyReading.length; i++) {
    const item = weeklyReading[i]
    if (!item) continue
    const originalLink = item.link || item.url || ""
    if (!originalLink) continue
    const shortLink = isShortLink(originalLink)
      ? originalLink
      : await createShortLink(originalLink, null, sequenceId || null)
    item.link = shortLink
    item.url = shortLink
  }

  if (content.what_were_cooking) {
    const originalLink = content.what_were_cooking.link || content.what_were_cooking.url || ""
    if (originalLink) {
      const shortLink = isShortLink(originalLink)
        ? originalLink
        : await createShortLink(originalLink, null, sequenceId || null)
      content.what_were_cooking.link = shortLink
      content.what_were_cooking.url = shortLink
    }
  }

  return content
}

const CONTENT_SOURCE_DESCRIPTIONS: Record<string, { label: string; jsonFields: string; instruction: string }> = {
  news: {
    label: "News",
    jsonFields: '"featured_story" and "top_stories"',
    instruction: "Select the most impactful articles as a featured story and top stories with headlines and insights.",
  },
  chefs_table: {
    label: "Chef's Table",
    jsonFields: '"intro"',
    instruction: 'Write a 2-3 sentence editorial intro ("Chef\'s Table") about today\'s most important developments.',
  },
  recipes: {
    label: "Recipes",
    jsonFields: '"recipes"',
    instruction: "If any saved social posts or curated articles are provided, include them in a recipes array with title, summary, and link.",
  },
  cooking: {
    label: "What We're Cooking",
    jsonFields: '"looking_ahead"',
    instruction: 'Write a "Looking Ahead" / "What We\'re Cooking" section with 2-3 sentences about upcoming trends or things to watch.',
  },
}

function buildContentSectionsText(contentSources: string[]): string {
  if (!contentSources || contentSources.length === 0) {
    // All sections when none specified
    return Object.values(CONTENT_SOURCE_DESCRIPTIONS)
      .map((s) => `- ${s.label}: ${s.instruction}`)
      .join("\n")
  }

  const included = contentSources
    .filter((s) => CONTENT_SOURCE_DESCRIPTIONS[s])
    .map((s) => {
      const desc = CONTENT_SOURCE_DESCRIPTIONS[s]
      return `- ${desc.label} (${desc.jsonFields}): ${desc.instruction}`
    })

  const excluded = Object.entries(CONTENT_SOURCE_DESCRIPTIONS)
    .filter(([key]) => !contentSources.includes(key))
    .map(([, desc]) => desc.jsonFields)

  let text = `INCLUDE these sections:\n${included.join("\n")}`
  if (excluded.length > 0) {
    text += `\n\nDO NOT include these fields in your JSON output: ${excluded.join(", ")}. Omit them entirely.`
  }

  return text
}

export async function generateNewsletterContent(
  articles: any[],
  systemPrompt: string,
  userPrompt: string,
  options?: {
    contentSources?: string[]
    readingItems?: SavedPromptReadingItem[]
    cookingItem?: SavedPromptCookingItem | null
  }
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
  const weeklyPromptData = await getSavedWeeklyPromptData(options)
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const weekEnd = new Date().toISOString()
  if (systemPrompt || userPrompt) {
    // Replace template placeholders with actual data
    const contentSectionsText = buildContentSectionsText(options?.contentSources || [])

    const processedSystemPrompt = systemPrompt
      .replace(/\{\{\s*\$json\.content_sections\s*\}\}/g, contentSectionsText)

    const processedUserPrompt = userPrompt
      .replace(/\{\{\s*\$json\.articles\s*\}\}/g, JSON.stringify(articles, null, 2))
      .replace(/\{\{\s*JSON\.stringify\(\$json\.articles[^}]*\}\}/g, JSON.stringify(articles, null, 2))
      .replace(/\{\{\s*\$json\.day_start\s*\}\}/g, new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .replace(/\{\{\s*\$json\.day_end\s*\}\}/g, new Date().toISOString())
      .replace(/\{\{\s*\$json\.week_start\s*\}\}/g, weekStart)
      .replace(/\{\{\s*\$json\.week_end\s*\}\}/g, weekEnd)
      .replace(/\{\{\s*\$json\.total_articles\s*\}\}/g, String(articles.length))
      .replace(/\{\{\s*\$json\.reading_items\s*\}\}/g, JSON.stringify(weeklyPromptData.readingItems, null, 2))
      .replace(/\{\{\s*\$json\.cooking_item\s*\}\}/g, JSON.stringify(weeklyPromptData.cookingItem || {}, null, 2))
      .replace(/\{\{\s*\$json\.content_sections\s*\}\}/g, contentSectionsText)
      .replace(/\{\{\s*JSON\.stringify\(\$json\.reading_items[^}]*\}\}/g, JSON.stringify(weeklyPromptData.readingItems, null, 2))
      .replace(/\{\{\s*JSON\.stringify\(\$json\.cooking_item[^}]*\}\}/g, JSON.stringify(weeklyPromptData.cookingItem || {}, null, 2))

    prompt = `${processedSystemPrompt ? processedSystemPrompt + "\n\n" : ""}${processedUserPrompt}`
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
    const shouldIncludeReading = !options?.contentSources || options.contentSources.length === 0 || options.contentSources.includes("recipes")
    const shouldIncludeCooking = !options?.contentSources || options.contentSources.length === 0 || options.contentSources.includes("cooking")
    if (shouldIncludeReading && (!Array.isArray(parsed.what_were_reading) || parsed.what_were_reading.length === 0)) {
      parsed.what_were_reading = weeklyPromptData.readingItems.slice(0, 5).map((item) => ({
        title: item.title,
        url: item.url,
        description: item.description,
      }))
    }
    if (shouldIncludeCooking && (!parsed.what_were_cooking || !parsed.what_were_cooking.title)) {
      parsed.what_were_cooking = weeklyPromptData.cookingItem
        ? {
            title: weeklyPromptData.cookingItem.title,
            url: weeklyPromptData.cookingItem.url,
            description: weeklyPromptData.cookingItem.description,
          }
        : { title: "", url: "", description: "" }
    }
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
  if (Array.isArray(content.news) && content.news.length > 0) {
    const chefsTable = content.from_chefs_table?.body || content.intro || ""
    const reading = content.what_were_reading || []
    const cooking = content.what_were_cooking
    return `
CUCINA LABS - WEEKLY UPDATE

${chefsTable}

NEWS
${content.news.map((item, index) => `${index + 1}. ${item.headline || ""}\n${item.why_this_matters || ""}\n${item.link || item.url || ""}`).join("\n\n")}

${reading.length ? `WHAT WE'RE READING\n${reading.map((item) => `${item.title || ""}\n${item.description || item.summary || ""}\n${item.url || item.link || ""}`).join("\n\n")}` : ""}

${cooking?.title ? `WHAT WE'RE COOKING\n${cooking.title}\n${cooking.description || ""}\n${cooking.url || cooking.link || ""}` : ""}

---
© ${new Date().getFullYear()} cucina labs
Unsubscribe: ${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe
  `.trim()
  }

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
Unsubscribe: ${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe
  `.trim()
}

export async function runDistribution(sequenceId: string, options: { skipArticleCheck?: boolean } = {}): Promise<void> {
  const sequence = await findSequenceById(sequenceId)

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
    let globalConfig: { systemPrompt?: string; userPrompt?: string } | null = null
    try {
      globalConfig = await findSequencePromptConfig()
    } catch {
      // Table may not exist yet if migration hasn't run
    }
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
    userPrompt,
    { contentSources: sequence.contentSources || [] }
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
    const newsletterTemplate = await findNewsletterTemplateById(sequence.templateId)
    if (newsletterTemplate) {
      template = newsletterTemplate.html
    }
  } else {
    const defaultTemplate = await findDefaultNewsletterTemplate()
    if (defaultTemplate) {
      template = defaultTemplate.html
    }
  }

  // Generate email HTML and plain text
  const html = generateEmailHtml(content, { articles, origin: process.env.NEXT_PUBLIC_BASE_URL || "", template })
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
  await updateSequence(sequenceId, { lastSent: new Date() })
}
