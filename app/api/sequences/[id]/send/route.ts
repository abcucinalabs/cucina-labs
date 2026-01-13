import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { runDistribution } from "@/lib/distribution"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
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
