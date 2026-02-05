export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import {
  findWeeklyNewsletterByWeekRange,
  createWeeklyNewsletter,
  findWeeklyNewslettersByStatus,
  findAllWeeklyNewsletters,
  findSavedContentByIds,
} from "@/lib/dal"
import { startOfWeek, endOfWeek, addDays } from "date-fns"

// GET - List all weekly newsletters or get current week's
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const current = searchParams.get("current") === "true"
    const status = searchParams.get("status")

    if (current) {
      // Get or create current week's newsletter
      const today = new Date()
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 }) // Sunday

      let newsletter = await findWeeklyNewsletterByWeekRange(weekStart, weekEnd)

      // Create if doesn't exist
      if (!newsletter) {
        newsletter = await createWeeklyNewsletter({
          weekStart,
          weekEnd,
          status: "draft",
        })
      }

      // Fetch associated saved content (recipes)
      const recipes = newsletter.recipeIds.length > 0
        ? await findSavedContentByIds(newsletter.recipeIds)
        : []

      return NextResponse.json({ ...newsletter, recipes })
    }

    // List all newsletters
    const newsletters = status
      ? await findWeeklyNewslettersByStatus(status)
      : await findAllWeeklyNewsletters()

    return NextResponse.json(newsletters)
  } catch (error) {
    console.error("Failed to fetch weekly newsletters:", error)
    return NextResponse.json(
      { error: "Failed to fetch weekly newsletters" },
      { status: 500 }
    )
  }
}

// POST - Create new weekly newsletter
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { weekStart: weekStartStr } = body

    const weekStart = weekStartStr
      ? new Date(weekStartStr)
      : startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekEnd = addDays(weekStart, 6)

    // Check if newsletter already exists for this week
    const existing = await findWeeklyNewsletterByWeekRange(
      startOfWeek(weekStart, { weekStartsOn: 1 }),
      endOfWeek(weekStart, { weekStartsOn: 1 })
    )

    if (existing) {
      return NextResponse.json(
        { error: "Newsletter already exists for this week", newsletter: existing },
        { status: 409 }
      )
    }

    const newsletter = await createWeeklyNewsletter({
      weekStart,
      weekEnd,
      status: "draft",
    })

    return NextResponse.json(newsletter, { status: 201 })
  } catch (error) {
    console.error("Failed to create weekly newsletter:", error)
    return NextResponse.json(
      { error: "Failed to create weekly newsletter" },
      { status: 500 }
    )
  }
}
