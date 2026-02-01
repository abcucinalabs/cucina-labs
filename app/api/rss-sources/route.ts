import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { findAllRssSources, createRssSource } from "@/lib/dal"
import { logNewsActivity } from "@/lib/news-activity"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const createRssSourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  category: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sources = await findAllRssSources()

    return NextResponse.json(sources, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error("Failed to fetch RSS sources:", error)
    return NextResponse.json(
      { error: "Failed to fetch RSS sources" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, url, category } = createRssSourceSchema.parse(body)

    const source = await createRssSource({ name, url, category })

    await logNewsActivity({
      event: "rss.source.created",
      status: "success",
      message: `RSS source added: ${name}.`,
      metadata: { id: source.id, url, category },
    })

    return NextResponse.json(source, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to create RSS source:", error)
    await logNewsActivity({
      event: "rss.source.error",
      status: "error",
      message: "Failed to create RSS source.",
      metadata: { error: String(error) },
    })
    return NextResponse.json(
      { error: "Failed to create RSS source" },
      { status: 500 }
    )
  }
}
