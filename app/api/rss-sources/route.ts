import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
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
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sources = await prisma.rssSource.findMany({
      orderBy: { createdAt: "desc" },
    })

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
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, url, category } = createRssSourceSchema.parse(body)

    const source = await prisma.rssSource.create({
      data: { name, url, category },
    })

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
