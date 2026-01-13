import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 200) : 50

    const activityModel = (prisma as any).newsActivity
    if (!activityModel) {
      return NextResponse.json(
        { error: "NewsActivity model not available. Restart the dev server." },
        { status: 500 }
      )
    }

    const logs = await activityModel.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json(logs, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("Failed to fetch news logs:", error)
    const errorCode = (error as { code?: string })?.code
    if (errorCode === "P2021" || errorCode === "P2022") {
      return NextResponse.json(
        { error: "NewsActivity table missing. Run prisma db push and restart the server." },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: "Failed to fetch news logs" },
      { status: 500 }
    )
  }
}
