import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { findSequencePromptConfig } from "@/lib/dal"
import {
  defaultSequenceSystemPrompt,
  defaultSequenceUserPrompt,
} from "@/lib/sequence-prompt-defaults"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Try DB first, fall back to hardcoded defaults
    let config: { systemPrompt?: string; userPrompt?: string } | null = null
    try {
      config = await findSequencePromptConfig()
    } catch {
      // Table may not exist yet if migration hasn't run
    }

    return NextResponse.json({
      systemPrompt: config?.systemPrompt || defaultSequenceSystemPrompt,
      userPrompt: config?.userPrompt || defaultSequenceUserPrompt,
    })
  } catch (error) {
    console.error("Failed to fetch defaults:", error)
    return NextResponse.json(
      { error: "Failed to fetch defaults" },
      { status: 500 }
    )
  }
}
