import { NextRequest, NextResponse } from "next/server"
import { findRecentArticles } from "@/lib/dal"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const limit = body.limit || 3

    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const articles = await findRecentArticles(cutoff, limit)

    const items = articles.map((a: any) => ({
      id: a.id,
      title: a.title,
      url: a.url,
      summary: a.summary || "",
      source: a.source || "",
    }))

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Failed to fetch news:", error)
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    )
  }
}
