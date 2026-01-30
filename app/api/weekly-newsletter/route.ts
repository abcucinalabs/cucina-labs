import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
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

      let newsletter = await prisma.weeklyNewsletter.findFirst({
        where: {
          weekStart: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      })

      // Create if doesn't exist
      if (!newsletter) {
        newsletter = await prisma.weeklyNewsletter.create({
          data: {
            weekStart,
            weekEnd,
            status: "draft",
          },
        })
      }

      // Fetch associated saved content (recipes)
      const recipes = newsletter.recipeIds.length > 0
        ? await prisma.savedContent.findMany({
            where: { id: { in: newsletter.recipeIds } },
          })
        : []

      return NextResponse.json({ ...newsletter, recipes })
    }

    // List all newsletters
    const where: any = {}
    if (status) where.status = status

    const newsletters = await prisma.weeklyNewsletter.findMany({
      where,
      orderBy: { weekStart: "desc" },
      take: 20,
    })

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
    const existing = await prisma.weeklyNewsletter.findFirst({
      where: {
        weekStart: {
          gte: startOfWeek(weekStart, { weekStartsOn: 1 }),
          lte: endOfWeek(weekStart, { weekStartsOn: 1 }),
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Newsletter already exists for this week", newsletter: existing },
        { status: 409 }
      )
    }

    const newsletter = await prisma.weeklyNewsletter.create({
      data: {
        weekStart,
        weekEnd,
        status: "draft",
      },
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
