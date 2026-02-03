import {
  findApiKeyByService,
  upsertArticle,
  findEnabledRssSources,
  findIngestionConfig,
} from "./dal"
import { GoogleGenerativeAI } from "@google/generative-ai"
import Parser from "rss-parser"
import { logNewsActivity } from "@/lib/news-activity"
import { DEFAULT_PROMPTS } from "@/lib/prompt-defaults"
import { getServiceApiKey } from "./service-keys"
import { normalizeGeminiModel } from "./gemini-model"

const parser = new Parser({
  customFields: {
    item: [
      ["content:encoded", "content:encoded"],
      ["media:content", "media:content"],
      ["media:thumbnail", "media:thumbnail"],
      ["itunes:image", "itunes:image"],
      ["image", "image"],
    ],
  },
})

const normalizeCategory = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

const fallbackImages: Record<string, string> = {
  [normalizeCategory("Agentic AI & Agents")]:
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
  [normalizeCategory("LLMs & Foundation Models")]:
    "https://images.unsplash.com/photo-1655720357761-f18ea9e5e7e6?w=800&q=80",
  [normalizeCategory("AI Product & UX")]:
    "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80",
  [normalizeCategory("AI Safety & Governance")]:
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
  [normalizeCategory("AI Infrastructure & Tooling")]:
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
  [normalizeCategory("Regulation & Policy")]:
    "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80",
  [normalizeCategory("Research & Whitepapers")]:
    "https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b7?w=800&q=80",
  default: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
}

const categoryAliases: Record<string, string> = {
  [normalizeCategory("AI Product Strategy")]: normalizeCategory("AI Product & UX"),
  [normalizeCategory("AI Infrastructure")]: normalizeCategory("AI Infrastructure & Tooling"),
  [normalizeCategory("Research")]: normalizeCategory("Research & Whitepapers"),
  [normalizeCategory("LLMs and Foundation Models")]: normalizeCategory("LLMs & Foundation Models"),
}

const getFallbackImage = (category?: string) => {
  if (!category) return fallbackImages.default
  const normalized = normalizeCategory(category)
  const alias = categoryAliases[normalized] || normalized
  return fallbackImages[alias] || fallbackImages.default
}

interface Article {
  title: string
  content: string
  link: string
  pubDate: string
  imageUrl?: string
  category?: string
  creator?: string
  aiGeneratedSummary?: string
  whyItMatters?: string
  businessValue?: string
}

function generateCanonicalLink(url: string): string {
  try {
    const urlObj = new URL(url)
    // Remove UTM parameters
    urlObj.searchParams.delete("utm_source")
    urlObj.searchParams.delete("utm_medium")
    urlObj.searchParams.delete("utm_campaign")
    urlObj.searchParams.delete("utm_term")
    urlObj.searchParams.delete("utm_content")
    return urlObj.toString()
  } catch {
    return url
  }
}

function extractImageFromHtml(html: string): string | null {
  const srcsetMatch = html.match(/<img[^>]+srcset=["']([^"']+)["']/i)
  if (srcsetMatch) {
    const first = srcsetMatch[1].split(",")[0]?.trim()
    if (first) {
      const url = first.split(" ")[0]
      if (url) return url
    }
  }

  const srcMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (srcMatch) return srcMatch[1]

  const dataSrcMatch = html.match(/<img[^>]+data-src=["']([^"']+)["']/i)
  if (dataSrcMatch) return dataSrcMatch[1]

  return null
}

function extractImageFromItem(item: any): string | null {
  const extractUrl = (value: any): string | null => {
    if (!value) return null

    if (typeof value === "string") return value

    if (Array.isArray(value)) {
      for (const entry of value) {
        const url = extractUrl(entry)
        if (url) return url
      }
      return null
    }

    if (typeof value === "object") {
      const type = value.type || value.$?.type || value.$?.medium
      if (type && !String(type).includes("image")) {
        return null
      }

      return (
        value.url ||
        value.href ||
        value.link ||
        value.$?.url ||
        value.$?.href ||
        null
      )
    }

    return null
  }

  return (
    extractUrl(item.enclosure) ||
    extractUrl(item.enclosures) ||
    extractUrl(item["media:content"]) ||
    extractUrl(item["media:thumbnail"]) ||
    extractUrl(item["itunes:image"]) ||
    extractUrl(item.image) ||
    extractImageFromHtml(item["content:encoded"] || item.content || item.contentSnippet || "")
  )
}

async function fetchRssFeed(url: string): Promise<Article[]> {
  try {
    const feed = await parser.parseURL(url)
    return feed.items.map((item) => ({
      title: item.title || "",
      content: item.content || item.contentSnippet || "",
      link: item.link || "",
      pubDate: item.pubDate || new Date().toISOString(),
      imageUrl: extractImageFromItem(item) || undefined,
    }))
  } catch (error) {
    console.error(`Failed to fetch RSS feed ${url}:`, error)
    return []
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

async function selectArticlesWithGemini(
  articles: Article[],
  systemPrompt: string,
  userPrompt: string
): Promise<Article[]> {
  const geminiConfig = await getGeminiConfig()
  if (!geminiConfig) {
    throw new Error("Gemini API key not configured")
  }

  const genAI = new GoogleGenerativeAI(geminiConfig.apiKey)
  const model = genAI.getGenerativeModel({ model: geminiConfig.model })

  const prompt = `${systemPrompt ? systemPrompt + "\n\n" : ""}${userPrompt}\n\nArticles:\n${JSON.stringify(articles, null, 2)}`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse JSON response from Gemini.
    // Supports legacy array responses and object responses with an `items` array.
    let selected: any[] = []
    const objectMatch = text.match(/\{[\s\S]*\}/)
    const arrayMatch = text.match(/\[[\s\S]*\]/)

    if (objectMatch) {
      const parsed = JSON.parse(objectMatch[0])
      if (Array.isArray(parsed)) {
        selected = parsed
      } else if (Array.isArray(parsed?.items)) {
        selected = parsed.items
      }
    } else if (arrayMatch) {
      const parsed = JSON.parse(arrayMatch[0])
      if (Array.isArray(parsed)) {
        selected = parsed
      }
    }

    if (!Array.isArray(selected) || selected.length === 0) {
      console.error("Failed to parse structured Gemini selection response:", text)
      return []
    }

    const articleByLink = new Map<string, Article>()
    for (const article of articles) {
      articleByLink.set(generateCanonicalLink(article.link), article)
    }

    const asOptionalString = (value: unknown) => {
      if (typeof value !== "string") return undefined
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : undefined
    }

    const normalizeItem = (item: any) => {
      if (typeof item === "string") {
        if (item.startsWith("http")) {
          return { link: item }
        }
        return { title: item }
      }

      if (!item || typeof item !== "object") return {}

      return {
        title: asOptionalString(item.title) || asOptionalString(item.headline) || asOptionalString(item.name),
        link:
          asOptionalString(item.source_link) ||
          asOptionalString(item.sourceLink) ||
          asOptionalString(item.link) ||
          asOptionalString(item.url),
        image:
          asOptionalString(item.image_link) ||
          asOptionalString(item.imageUrl) ||
          asOptionalString(item.image_url),
        category: asOptionalString(item.category),
        creator: asOptionalString(item.creator),
        aiGeneratedSummary:
          asOptionalString(item.ai_generated_summary) ||
          asOptionalString(item.aiSummary) ||
          asOptionalString(item.summary),
        whyItMatters: asOptionalString(item.why_it_matters) || asOptionalString(item.whyItMatters),
        businessValue: asOptionalString(item.business_value) || asOptionalString(item.businessValue),
        publishedDate: asOptionalString(item.published_date) || asOptionalString(item.publishedDate),
      }
    }

    const enriched: Article[] = []
    for (const item of selected) {
      const normalized = normalizeItem(item)
      const canonicalLink = normalized.link ? generateCanonicalLink(normalized.link) : null
      const base =
        (canonicalLink ? articleByLink.get(canonicalLink) : undefined) ||
        (normalized.title
          ? articles.find((article) => article.title === normalized.title)
          : undefined)

      const title = base?.title || normalized.title
      const link = base?.link || normalized.link
      if (!title || !link) continue

      const pubDate = base?.pubDate || normalized.publishedDate || new Date().toISOString()
      const imageUrl = normalized.image || base?.imageUrl

      enriched.push({
        title,
        content: base?.content || "",
        link,
        pubDate,
        imageUrl: imageUrl || undefined,
        category: normalized.category ?? base?.category,
        creator: normalized.creator ?? base?.creator,
        aiGeneratedSummary: normalized.aiGeneratedSummary,
        whyItMatters: normalized.whyItMatters,
        businessValue: normalized.businessValue,
      })
    }

    if (enriched.length > 0) {
      return enriched
    }

    return articles.filter((article) =>
      selected.some((s: any) => s?.link === article.link || s?.title === article.title)
    )
  } catch (error) {
    console.error("Gemini API error:", error)
    return []
  }
}

async function saveToDatabase(article: Article): Promise<void> {
  const canonicalLink = generateCanonicalLink(article.link)
  const publishedDate = new Date(article.pubDate)
  const daysSincePublished = Math.floor(
    (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  try {
    const resolvedImageUrl = article.imageUrl || getFallbackImage(article.category)
    const updateData: Record<string, any> = {
      title: article.title,
      sourceLink: article.link,
      imageLink: resolvedImageUrl || null,
      ingestedAt: new Date(),
    }

    if (article.category) updateData.category = article.category
    if (article.creator) updateData.creator = article.creator
    if (article.aiGeneratedSummary) updateData.aiSummary = article.aiGeneratedSummary
    if (article.whyItMatters) updateData.whyItMatters = article.whyItMatters
    if (article.businessValue) updateData.businessValue = article.businessValue

    await upsertArticle(canonicalLink, {
      title: article.title,
      category: article.category || "AI Products",
      creator: article.creator || "AI Curator",
      aiSummary: article.aiGeneratedSummary || "",
      whyItMatters: article.whyItMatters || "",
      businessValue: article.businessValue || "",
      publishedDate,
      sourceLink: article.link,
      canonicalLink,
      imageLink: resolvedImageUrl || null,
      daysSincePublished,
      isRecent: daysSincePublished <= 1,
    }, updateData)
  } catch (error) {
    console.error("Database error:", error)
  }
}

export async function runIngestion(
  timeFrameHours: number = 24,
  systemPrompt?: string,
  userPrompt?: string
): Promise<{ processed: number; selected: number; stored: number }> {
  // Fetch enabled RSS sources
  const rssSources = await findEnabledRssSources()

  if (rssSources.length === 0) {
    return { processed: 0, selected: 0, stored: 0 }
  }

  // Fetch all articles from RSS feeds
  const allArticles: Article[] = []
  for (const source of rssSources) {
    const articles = await fetchRssFeed(source.url)
    const enriched = articles.map((article) => ({
      ...article,
      category: source.category || article.category,
      creator: source.name || article.creator,
    }))
    allArticles.push(...enriched)
  }

  // Filter by time frame
  const cutoffDate = new Date(Date.now() - timeFrameHours * 60 * 60 * 1000)
  const recentArticles = allArticles.filter((article) => {
    const pubDate = new Date(article.pubDate)
    return pubDate >= cutoffDate
  })

  // Get default prompts if not provided
  const config = await findIngestionConfig()
  const defaultSystemPrompt = systemPrompt ?? config?.systemPrompt ?? ""
  const defaultUserPrompt =
    userPrompt ??
    config?.userPrompt ??
    DEFAULT_PROMPTS.ingestion

  // Select articles using Gemini
  const selectedArticles = await selectArticlesWithGemini(
    recentArticles,
    defaultSystemPrompt,
    defaultUserPrompt
  )

  // Save selected articles to database
  let stored = 0
  for (const article of selectedArticles) {
    try {
      await saveToDatabase(article)
      stored++
    } catch (error) {
      console.error("Failed to save article to database:", error)
    }
  }

  return {
    processed: recentArticles.length,
    selected: selectedArticles.length,
    stored,
  }
}
