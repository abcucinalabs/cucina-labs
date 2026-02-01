import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { findNewsActivity } from "@/lib/dal"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 200) : 50

    const logs = await findNewsActivity(limit)

    return NextResponse.json(logs, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("Failed to fetch news logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch news logs" },
      { status: 500 }
    )
  }
}
