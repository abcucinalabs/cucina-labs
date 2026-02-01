import { NextResponse } from "next/server"
import {
  findWeeklyNewsletterById,
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

    // Get saved recipes
    const recipes = newsletter.recipeIds.length > 0
      ? await findSavedContentByIds(newsletter.recipeIds)
      : []

    // Build context and render
    const context = buildWeeklyNewsletterContext(
      {
        weekStart: newsletter.weekStart,
        chefsTableTitle: newsletter.chefsTableTitle,
        chefsTableBody: newsletter.chefsTableBody,
        newsItems: newsletter.newsItems as any[] | null,
        cookingItems: newsletter.cookingItems as any[] | null,
      },
      recipes.map((r: any) => ({
        title: r.title,
        url: r.url,
        description: r.description,
        source: r.source,
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
