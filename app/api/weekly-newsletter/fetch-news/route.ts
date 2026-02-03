import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { findApiKeyByService, findRecentArticles, findWeeklyPromptConfig } from "@/lib/dal"
import { DEFAULT_PROMPTS } from "@/lib/prompt-defaults"
import { getServiceApiKey } from "@/lib/service-keys"
import { normalizeGeminiModel } from "@/lib/gemini-model"

export const dynamic = "force-dynamic"

type WeeklyStory = {
  id?: number | string
  title?: string
  headline?: string
  summary?: string
  why_this_matters?: string
  source?: string
  url?: string
  link?: string
}

function parseWeeklyStories(responseText: string): WeeklyStory[] {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return []

  const parsed = JSON.parse(jsonMatch[0])
  if (Array.isArray(parsed)) return parsed
  if (Array.isArray(parsed?.items)) return parsed.items
  if (Array.isArray(parsed?.news)) return parsed.news
  return []
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const limit = Math.min(Math.max(Number(body.limit) || 3, 1), 10)

    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const weekStart = cutoff.toISOString()
    const weekEnd = new Date().toISOString()

    // Pull a larger pool, then let the prompt choose the strongest weekly stories.
    const recentArticles = await findRecentArticles(cutoff, 120)
    if (recentArticles.length === 0) {
      return NextResponse.json({ items: [] })
    }

    const promptConfig = await findWeeklyPromptConfig().catch(() => null)
    const promptTemplate = promptConfig?.promptText || DEFAULT_PROMPTS.weekly_update

    const articlesForPrompt = recentArticles.map((article: any, index: number) => ({
      id: index + 1,
      article_id: article.id,
      title: article.title,
      creator: article.creator || "",
      category: article.category || "",
      ai_generated_summary: article.aiSummary || "",
      why_it_matters: article.whyItMatters || "",
      business_value: article.businessValue || "",
      published_date: article.publishedDate,
      source_link: article.sourceLink,
      image_link: article.imageLink || null,
    }))

    const prompt = promptTemplate
      .replace(/\{\{\s*\$json\.week_start\s*\}\}/g, weekStart)
      .replace(/\{\{\s*\$json\.week_end\s*\}\}/g, weekEnd)
      .replace(/\{\{\s*\$json\.total_articles\s*\}\}/g, String(articlesForPrompt.length))
      .replace(/\{\{\s*\$json\.reading_items\s*\}\}/g, JSON.stringify([], null, 2))
      .replace(/\{\{\s*\$json\.cooking_item\s*\}\}/g, JSON.stringify({}, null, 2))
      .replace(/\{\{\s*\$json\.articles\s*\}\}/g, JSON.stringify(articlesForPrompt, null, 2))
      .replace(/\{\{\s*JSON\.stringify\(\$json\.articles[^}]*\}\}/g, JSON.stringify(articlesForPrompt, null, 2))
      .replace(/\{\{\s*JSON\.stringify\(\$json\.reading_items[^}]*\}\}/g, JSON.stringify([], null, 2))
      .replace(/\{\{\s*JSON\.stringify\(\$json\.cooking_item[^}]*\}\}/g, JSON.stringify({}, null, 2))

    const geminiConfig = await findApiKeyByService("gemini")
    const geminiApiKey = await getServiceApiKey("gemini")
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured for weekly selection." },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: normalizeGeminiModel(geminiConfig?.geminiModel) })
    const result = await model.generateContent(prompt)
    const text = (await result.response).text()

    const selectedStories = parseWeeklyStories(text)
    const normalized = selectedStories
      .map((story) => ({
        id: story.id,
        title: story.title || story.headline || "",
        url: story.url || story.link || "",
        summary: story.summary || story.why_this_matters || "",
        source: story.source || "",
      }))
      .filter((item) => item.title && item.url)
      .slice(0, limit)

    if (normalized.length > 0) {
      return NextResponse.json({ items: normalized })
    }

    // Fallback when model output is malformed: use most recent items from DB schema fields.
    const fallback = recentArticles.slice(0, limit).map((article: any, idx: number) => ({
      id: idx + 1,
      title: article.title,
      url: article.sourceLink,
      summary: article.aiSummary || article.whyItMatters || "",
      source: article.creator || "",
    }))

    return NextResponse.json({ items: fallback })
  } catch (error) {
    console.error("Failed to fetch weekly news:", error)
    return NextResponse.json(
      { error: "Failed to fetch weekly news" },
      { status: 500 }
    )
  }
}
