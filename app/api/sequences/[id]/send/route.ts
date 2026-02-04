import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { runDistribution } from "@/lib/distribution"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const sendNowSchema = z.object({
  subject: z.string().optional(),
})

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
    const body = await request.json().catch(() => ({}))
    const { subject } = sendNowSchema.parse(body)

    // Run distribution immediately for this sequence, bypassing the recent articles check
    await runDistribution(sequenceId, {
      skipArticleCheck: true,
      subjectOverride: subject,
    })

    return NextResponse.json({
      success: true,
      message: "Newsletter sent successfully to all subscribers!",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to send newsletter:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send newsletter",
      },
      { status: 500 }
    )
  }
}
