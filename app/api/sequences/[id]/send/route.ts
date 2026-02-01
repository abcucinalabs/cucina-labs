import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { runDistribution } from "@/lib/distribution"

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sequenceId = params.id

    // Run distribution immediately for this sequence, bypassing the recent articles check
    await runDistribution(sequenceId, { skipArticleCheck: true })

    return NextResponse.json({
      success: true,
      message: "Newsletter sent successfully to all subscribers!",
    })
  } catch (error) {
    console.error("Failed to send newsletter:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send newsletter",
      },
      { status: 500 }
    )
  }
}
