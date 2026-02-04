import { NextResponse } from "next/server"
import {
  findWeeklyNewsletterById,
  findSavedContent,
  findSavedContentByIds,
} from "@/lib/dal"
import { renderWeeklyNewsletter, buildWeeklyNewsletterContext } from "@/lib/weekly-newsletter-template"

// POST - Preview the weekly newsletter HTML
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { origin } = body

    const newsletter = await findWeeklyNewsletterById(id)

    if (!newsletter) {
      return NextResponse.json(
        { error: "Newsletter not found" },
        { status: 404 }
      )
    }

    const [autoRecipes, autoCooking, selectedRecipes] = await Promise.all([
      findSavedContent({ type: "reading" }),
      findSavedContent({ type: "cooking" }),
      newsletter.recipeIds.length > 0 ? findSavedContentByIds(newsletter.recipeIds) : Promise.resolve([]),
    ])

    const recipes = selectedRecipes.length > 0 ? selectedRecipes : autoRecipes
    const cooking = Array.isArray(newsletter.cookingItems) && newsletter.cookingItems.length > 0
      ? newsletter.cookingItems
      : autoCooking

    // Build context and render
    const context = buildWeeklyNewsletterContext(
      {
        weekStart: newsletter.weekStart,
        chefsTableTitle: newsletter.chefsTableTitle,
        chefsTableBody: newsletter.chefsTableBody,
        newsItems: newsletter.newsItems as any[] | null,
      },
      recipes.map((r: any) => ({
        title: r.title,
        url: r.url,
        description: r.description,
        source: r.source,
        createdAt: r.createdAt,
      })),
      cooking.map((c: any) => ({
        title: c.title,
        url: c.url,
        description: c.description,
        createdAt: c.createdAt,
      })),
      origin
    )

    const html = renderWeeklyNewsletter(context)

    return NextResponse.json({
      html,
      context,
    })
  } catch (error) {
    console.error("Failed to preview newsletter:", error)
    return NextResponse.json(
      { error: "Failed to preview newsletter", details: String(error) },
      { status: 500 }
    )
  }
}
