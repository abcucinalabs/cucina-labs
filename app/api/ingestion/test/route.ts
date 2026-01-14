import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { runIngestion } from "@/lib/ingestion"
import { logNewsActivity } from "@/lib/news-activity"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const timeFrame = parseInt(body.timeFrame || "24")

    await logNewsActivity({
      event: "ingestion.test.start",
      status: "info",
      message: "Test ingestion started.",
      metadata: { timeFrame, user: session.user?.email },
    })

    const result = await runIngestion(timeFrame)

    await logNewsActivity({
      event: "ingestion.test.success",
      status: "success",
      message: `Test ingestion completed. Processed ${result.processed}, selected ${result.selected}, stored ${result.stored}.`,
      metadata: { timeFrame, processed: result.processed, selected: result.selected, stored: result.stored },
    })

    return NextResponse.json({
      success: true,
      processed: result.processed,
      selected: result.selected,
      stored: result.stored,
      articles: [], // Could return actual articles if needed
    })
  } catch (error) {
    console.error("Test ingestion failed:", error)
    await logNewsActivity({
      event: "ingestion.test.error",
      status: "error",
      message: "Test ingestion failed.",
      metadata: { error: String(error) },
    })
    return NextResponse.json(
      { error: "Test ingestion failed", details: String(error) },
      { status: 500 }
    )
  }
}
