import { NextResponse } from "next/server"
import {
  findWeeklyNewsletterById,
  updateWeeklyNewsletter,
  findApiKeyByService,
  updateApiKey,
  findSavedContent,
  findSavedContentByIds,
} from "@/lib/dal"
import { decryptWithMetadata, encrypt } from "@/lib/encryption"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { normalizeGeminiModel } from "@/lib/gemini-model"

// POST - Generate Chef's Table content using AI
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { customPrompt } = body

    // Get newsletter
    const newsletter = await findWeeklyNewsletterById(id)

    if (!newsletter) {
      return NextResponse.json(
        { error: "Newsletter not found" },
        { status: 404 }
      )
    }

    // Get Gemini config
    const geminiConfig = await findApiKeyByService("gemini")

    if (!geminiConfig || !geminiConfig.key) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 400 }
      )
    }

    const { plaintext: apiKey, needsRotation } = decryptWithMetadata(geminiConfig.key)
    if (needsRotation) {
      await updateApiKey(geminiConfig.id, { key: encrypt(apiKey) })
    }

    const [savedRecipes, savedCooking, selectedRecipes] = await Promise.all([
      findSavedContent({ type: "reading" }),
      findSavedContent({ type: "cooking" }),
      newsletter.recipeIds.length > 0 ? findSavedContentByIds(newsletter.recipeIds) : Promise.resolve([]),
    ])

    const recipePool = selectedRecipes.length > 0 ? selectedRecipes : savedRecipes
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recipes = (recipePool || []).filter((item: any) => {
      if (!item.createdAt) return false
      return new Date(item.createdAt).getTime() >= weekAgo
    }).slice(0, 5)

    const cooking = Array.isArray(newsletter.cookingItems) && newsletter.cookingItems.length > 0
      ? newsletter.cookingItems.slice(0, 1)
      : (savedCooking || []).slice(0, 1)

    // Build context for AI
    const weekOf = newsletter.weekStart.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    const newsContext = (newsletter.newsItems as any[] || [])
      .map((item: any) => `- ${item.title}: ${item.summary || ''}`)
      .join('\n')

    const recipesContext = recipes
      .map((r: any) => `- ${r.title}: ${r.description || ''}`)
      .join('\n')

    const cookingContext = cooking
      .map((item: any) => `- ${item.title}: ${item.description || ''}`)
      .join('\n')

    const systemPrompt = newsletter.systemPrompt || `You are the editor of cucina labs weekly newsletter. Write clearly for Product Managers and business operators exploring AI products. Keep the kitchen metaphor light and natural.`

    const userPrompt = customPrompt || `Write the "From the Chef's Table" section for our weekly newsletter dated ${weekOf}. Return ONLY valid JSON with this exact shape: { "title": "optional short title", "body": "2-4 sentence intro paragraph" }.

Here's what we have this week:

NEWS FROM THE AI WORLD:
${newsContext || 'No news items yet'}

WHAT WE'RE READING (Saved reading items):
${recipesContext || 'No reading items saved yet'}

WHAT WE'RE COOKING:
${cookingContext || 'No experiments listed yet'}

Keep the intro warm, practical, and plain-language. Do not use hype or jargon.`

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: normalizeGeminiModel(geminiConfig.geminiModel) })

    const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`)
    const response = await result.response
    const text = response.text()

    // Parse JSON response
    let chefsTable = { title: null as string | null, body: '' }
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        chefsTable.title = parsed.title || null
        chefsTable.body = parsed.body || parsed.intro || parsed.content || text
      } else {
        chefsTable.body = text
      }
    } catch {
      chefsTable.body = text
    }

    // Update newsletter
    const updated = await updateWeeklyNewsletter(id, {
      chefsTableTitle: chefsTable.title,
      chefsTableBody: chefsTable.body,
      generatedAt: new Date(),
    })

    return NextResponse.json({
      newsletter: updated,
      generated: chefsTable,
    })
  } catch (error) {
    console.error("Failed to generate Chef's Table:", error)
    return NextResponse.json(
      { error: "Failed to generate content", details: String(error) },
      { status: 500 }
    )
  }
}
