import { prisma } from "./db"
import { decrypt } from "./encryption"
import { GoogleGenerativeAI } from "@google/generative-ai"
import Parser from "rss-parser"
import Airtable from "airtable"
import { logNewsActivity } from "@/lib/news-activity"

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
let loggedMissingAirtableConfig = false
let loggedMissingAirtableBase = false
let loggedDefaultAirtableTable = false
type AirtableFieldInfo = {
  name: string
  type: string
  options?: Record<string, any> | null
}

const airtableFieldCache = new Map<string, AirtableFieldInfo[]>()
const nonWritableFieldTypes = new Set([
  "formula",
  "rollup",
  "lookup",
  "createdTime",
  "autoNumber",
  "lastModifiedTime",
  "count",
  "multipleLookupValues",
])

const normalizeFieldName = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]/g, "")

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

const fieldAliases: Record<string, string[]> = {
  title: ["title", "headline"],
  category: ["category", "categories", "topic", "section"],
  creator: ["creator", "source", "publication", "outlet"],
  source_link: ["source_link", "source link", "source_url", "link", "url"],
  canonical_link: ["canonical_link", "canonical link", "canonical_url", "canonical url"],
  image_link: ["image_link", "image link", "image_url", "image url", "image"],
  published_date: ["published_date", "published date", "publish date", "pub_date"],
  ingested_at: ["ingested_at", "ingested at", "ingest date", "ingestion date"],
  days_since_published: ["days_since_published", "days since published"],
  is_recent: ["is_recent", "is recent", "recent"],
  ai_generated_summary: ["ai_generated_summary", "ai generated summary", "ai_summary", "ai summary", "summary"],
  why_it_matters: ["why_it_matters", "why it matters"],
  business_value: ["business_value", "business value"],
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
      imageUrl: extractImageFromItem(item),
    }))
  } catch (error) {
    console.error(`Failed to fetch RSS feed ${url}:`, error)
    return []
  }
}

async function getAirtableConfig(): Promise<{
  apiKey: string
  baseId?: string | null
  tableId?: string | null
  tableName?: string | null
} | null> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { service: "airtable" },
  })
  if (!apiKey || !apiKey.key) return null
  return {
    apiKey: decrypt(apiKey.key),
    baseId: apiKey.airtableBaseId,
    tableId: apiKey.airtableTableId,
    tableName: apiKey.airtableTableName,
  }
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

    // Parse JSON response from Gemini
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error("Failed to parse Gemini response:", text)
      return []
    }

    const selected = JSON.parse(jsonMatch[0])
    if (!Array.isArray(selected)) {
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

async function saveToAirtable(article: Article): Promise<boolean> {
  const config = await getAirtableConfig()
  if (!config?.apiKey) {
    if (!loggedMissingAirtableConfig) {
      loggedMissingAirtableConfig = true
      await logNewsActivity({
        event: "airtable.config.missing",
        status: "warning",
        message: "Airtable API key not configured; falling back to database.",
      })
    }
    // Fallback to PostgreSQL if Airtable not configured
    await saveToDatabase(article)
    return false
  }

  const baseId = config.baseId || process.env.AIRTABLE_BASE_ID
  const tableIdOrName =
    config.tableId ||
    config.tableName ||
    process.env.AIRTABLE_TABLE_ID ||
    process.env.AIRTABLE_TABLE_NAME ||
    "BriefingItems"

  if (!baseId) {
    if (!loggedMissingAirtableBase) {
      loggedMissingAirtableBase = true
      await logNewsActivity({
        event: "airtable.config.missing",
        status: "warning",
        message: "Airtable base ID not configured; falling back to database.",
        metadata: { table: tableIdOrName },
      })
    }
    await saveToDatabase(article)
    return false
  }

  if (!config.tableId && !config.tableName && !process.env.AIRTABLE_TABLE_ID && !process.env.AIRTABLE_TABLE_NAME) {
    if (!loggedDefaultAirtableTable) {
      loggedDefaultAirtableTable = true
      await logNewsActivity({
        event: "airtable.table.defaulted",
        status: "warning",
        message: "Airtable table not configured; defaulting to BriefingItems.",
        metadata: { table: tableIdOrName },
      })
    }
  }

  Airtable.configure({ apiKey: config.apiKey })
  const base = Airtable.base(baseId)

  const canonicalLink = generateCanonicalLink(article.link)
  const publishedDate = new Date(article.pubDate)
  const daysSincePublished = Math.floor(
    (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  let fields: AirtableFieldInfo[] = []
  let recordData: Record<string, unknown> = {}

  try {
    // Check for duplicates using Airtable API
    // Note: Airtable v0.12.2 uses callbacks, but we'll use a promise wrapper
    const table = base(tableIdOrName)
    fields = await getAirtableFields(config.apiKey, baseId, tableIdOrName)
    const fieldLookup = new Map<string, AirtableFieldInfo>()
    for (const field of fields) {
      fieldLookup.set(field.name, field)
      const normalized = normalizeFieldName(field.name)
      if (!fieldLookup.has(normalized)) {
        fieldLookup.set(normalized, field)
      }
    }

    const resolveField = (canonicalName: string): AirtableFieldInfo | null => {
      if (fields.length === 0) {
        return { name: canonicalName, type: "unknown", options: null }
      }
      const direct =
        fieldLookup.get(canonicalName) ||
        fieldLookup.get(normalizeFieldName(canonicalName)) ||
        null
      if (direct) return direct

      const aliases = fieldAliases[canonicalName] || []
      for (const alias of aliases) {
        const match =
          fieldLookup.get(alias) || fieldLookup.get(normalizeFieldName(alias))
        if (match) return match
      }

      return null
    }

    const isWritable = (fieldInfo: AirtableFieldInfo | null) => {
      if (!fieldInfo) return false
      if (fields.length === 0) return true
      return !nonWritableFieldTypes.has(fieldInfo.type)
    }

    const canonicalLinkField = resolveField("canonical_link")
    const sourceLinkField = resolveField("source_link")
    let filterField = canonicalLinkField?.name || sourceLinkField?.name || null

    const selectWithField = (field: string) =>
      new Promise<any[]>((resolve, reject) => {
        const fieldValue = field === canonicalLinkField?.name ? canonicalLink : article.link
        table.select({
          filterByFormula: `{${field}} = "${fieldValue}"`,
        }).firstPage((err, records) => {
          if (err) reject(err)
          else resolve(records || [])
        })
      })

    let records: any[] = []
    if (filterField) {
      try {
        records = await selectWithField(filterField)
      } catch (error) {
        const errorText = String(error)
        const isCanonicalField = canonicalLinkField && filterField === canonicalLinkField.name
        const isSourceField = sourceLinkField && filterField === sourceLinkField.name
        if (errorText.includes("INVALID_FILTER_BY_FORMULA") && isCanonicalField) {
          if (sourceLinkField || fields.length === 0) {
            filterField = sourceLinkField?.name || "source_link"
            records = await selectWithField(filterField)
          } else {
            filterField = null
          }
        } else if (errorText.includes("INVALID_FILTER_BY_FORMULA") && isSourceField) {
          filterField = null
        } else {
          throw error
        }
      }
    }

    recordData = {}
    const setField = (field: string, value: unknown) => {
      const info = resolveField(field)
      if (!info || !isWritable(info)) return

      let finalValue: unknown = value
      if (info.type === "checkbox") {
        finalValue = Boolean(value)
      } else if (info.type === "number") {
        const num = typeof value === "number" ? value : Number(value)
        if (Number.isNaN(num)) return
        finalValue = num
      } else if (info.type === "singleSelect") {
        const choices = info.options?.choices || []
        if (typeof value !== "string") return
        if (!choices.some((choice: any) => choice.name === value)) return
        finalValue = value
      } else if (info.type === "multipleSelects") {
        const choices = info.options?.choices || []
        const choiceNames = new Set(choices.map((choice: any) => choice.name))
        const values = Array.isArray(value) ? value : typeof value === "string" ? [value] : []
        const filtered = values.filter((item) => choiceNames.has(item))
        if (filtered.length === 0) return
        finalValue = filtered
      } else if (info.type === "attachment") {
        if (typeof value !== "string" || !value) return
        finalValue = [{ url: value }]
      } else if (
        info.type === "singleLineText" ||
        info.type === "multilineText" ||
        info.type === "richText" ||
        info.type === "url" ||
        info.type === "email"
      ) {
        finalValue = typeof value === "string" ? value : String(value)
      }

      recordData[info.name] = finalValue
    }
    const setDateField = (field: string, date: Date) => {
      const info = resolveField(field)
      if (!info || !isWritable(info)) return
      const iso = date.toISOString()
      const dateOnly = iso.split("T")[0]

      if (fields.length === 0) {
        recordData[info.name] = dateOnly
        return
      }

      if (info.type === "date") {
        if (info.options?.includeTime) {
          recordData[info.name] = iso
        } else {
          recordData[info.name] = dateOnly
        }
        return
      }

      if (info.type === "dateTime") {
        recordData[info.name] = iso
        return
      }

      if (info.type === "singleLineText" || info.type === "multilineText") {
        recordData[info.name] = dateOnly
        return
      }
    }

    const resolvedImageUrl = article.imageUrl || getFallbackImage(article.category)

    setField("title", article.title)
    setField("category", article.category || "AI Products")
    setField("creator", article.creator || "AI Curator")
    setField("source_link", article.link)
    setField("canonical_link", canonicalLink)
    setField("image_link", resolvedImageUrl)
    if (article.aiGeneratedSummary) {
      setField("ai_generated_summary", article.aiGeneratedSummary)
    }
    if (article.whyItMatters) {
      setField("why_it_matters", article.whyItMatters)
    }
    if (article.businessValue) {
      setField("business_value", article.businessValue)
    }
    setDateField("published_date", publishedDate)
    setDateField("ingested_at", new Date())
    setField("days_since_published", daysSincePublished)
    setField("is_recent", daysSincePublished <= 1)

    if (Object.keys(recordData).length === 0) {
      await logNewsActivity({
        event: "airtable.write.skipped",
        status: "warning",
        message: "No writable Airtable fields matched; falling back to database.",
        metadata: {
          baseId,
          table: tableIdOrName,
          articleLink: article.link,
          fields: fields.map((f) => ({ name: f.name, type: f.type, options: f.options })),
        },
      })
      await saveToDatabase(article)
      return false
    }

    if (records.length > 0) {
      // Update existing
      await new Promise<void>((resolve, reject) => {
        table.update(records[0].id, recordData, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
      await logNewsActivity({
        event: "airtable.write.success",
        status: "success",
        message: "Airtable record updated.",
        metadata: { baseId, table: tableIdOrName, articleLink: article.link, filterField },
      })
      return true
    } else {
      // Create new
      await new Promise<void>((resolve, reject) => {
        table.create(recordData, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
      await logNewsActivity({
        event: "airtable.write.success",
        status: "success",
        message: "Airtable record created.",
        metadata: { baseId, table: tableIdOrName, articleLink: article.link, filterField },
      })
      return true
    }
  } catch (error) {
    console.error("Airtable error:", error)
    await logNewsActivity({
      event: "airtable.write.error",
      status: "error",
      message: "Failed to write to Airtable; falling back to database.",
      metadata: {
        error: String(error),
        baseId,
        table: tableIdOrName,
        articleLink: article.link,
        fields: fields.map((f) => ({ name: f.name, type: f.type, options: f.options })),
        recordData,
      },
    })
    // Fallback to database
    await saveToDatabase(article)
    return false
  }
}

async function getAirtableFields(
  apiKey: string,
  baseId: string,
  tableIdOrName: string
): Promise<AirtableFieldInfo[]> {
  const cacheKey = `${baseId}:${tableIdOrName}`
  const cached = airtableFieldCache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const table = (data.tables || []).find((t: any) => t.id === tableIdOrName || t.name === tableIdOrName)
    const fields: AirtableFieldInfo[] =
      table?.fields?.map((field: any) => ({
        name: field.name,
        type: field.type,
        options: field.options || null,
      })) || []
    if (fields.length > 0) {
      airtableFieldCache.set(cacheKey, fields)
    }
    return fields
  } catch (error) {
    console.error("Failed to fetch Airtable fields:", error)
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

    await prisma.article.upsert({
      where: { canonicalLink },
      update: updateData,
      create: {
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
      },
    })
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
  const rssSources = await prisma.rssSource.findMany({
    where: { enabled: true },
  })

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
  const config = await prisma.ingestionConfig.findFirst()
  const defaultSystemPrompt = systemPrompt ?? config?.systemPrompt ?? ""
  const defaultUserPrompt =
    userPrompt ??
    config?.userPrompt ??
    "Select articles relevant to AI product builders. Return a JSON array of selected articles."

  // Select articles using Gemini
  const selectedArticles = await selectArticlesWithGemini(
    recentArticles,
    defaultSystemPrompt,
    defaultUserPrompt
  )

  // Save selected articles
  let stored = 0
  for (const article of selectedArticles) {
    const storedInAirtable = await saveToAirtable(article)
    if (storedInAirtable) {
      stored++
    }
  }

  return {
    processed: recentArticles.length,
    selected: selectedArticles.length,
    stored,
  }
}
