import { NextResponse } from "next/server"
import {
  findWeeklyNewsletterById,
  updateWeeklyNewsletter,
  findApiKeyByService,
  updateApiKey,
  findSavedContentByIds,
} from "@/lib/dal"
import { decryptWithMetadata, encrypt } from "@/lib/encryption"
import { GoogleGenerativeAI } from "@google/generative-ai"

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

    // Get saved recipes for context
    const recipes = newsletter.recipeIds.length > 0
      ? await findSavedContentByIds(newsletter.recipeIds)
      : []

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

    const cookingContext = (newsletter.cookingItems as any[] || [])
      .map((item: any) => `- ${item.title}: ${item.description || ''}`)
      .join('\n')

    const systemPrompt = newsletter.systemPrompt || `You are a friendly AI newsletter curator for "cucina labs", a company focused on AI product development and experiments. Write in a warm, conversational tone that feels like a friend sharing interesting finds. Keep it concise but engaging.`

    const userPrompt = customPrompt || `Write an engaging intro paragraph (2-3 sentences) for our weekly newsletter dated ${weekOf}. This is the "Chef's Table" section - think of it as setting the table for what's to come.

Here's what we have this week:

NEWS FROM THE AI WORLD:
${newsContext || 'No news items yet'}

RECIPES (Posts/Articles We Enjoyed):
${recipesContext || 'No recipes saved yet'}

WHAT WE'RE COOKING (Our Experiments):
${cookingContext || 'No experiments listed yet'}

Write a brief, engaging intro that gives readers a taste of what's coming. Don't list everything - just tease the highlights and set the mood. Return JSON with format: { "title": "optional catchy title", "body": "the intro paragraph" }`

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: geminiConfig.geminiModel || "gemini-2.5-flash-preview-05-20" })

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
