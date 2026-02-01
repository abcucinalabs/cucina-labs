import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { findSequencePromptConfig, upsertSequencePromptConfig } from "@/lib/dal"
import {
  defaultSequenceSystemPrompt,
  defaultSequenceUserPrompt,
} from "@/lib/sequence-prompt-defaults"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let config: { systemPrompt?: string; userPrompt?: string } | null = null
    try {
      config = await findSequencePromptConfig()
    } catch {
      // Table may not exist yet if migration hasn't run
    }

    return NextResponse.json({
      systemPrompt: config?.systemPrompt || defaultSequenceSystemPrompt,
      userPrompt: config?.userPrompt || defaultSequenceUserPrompt,
      isDefault: !config,
    })
  } catch (error) {
    console.error("Failed to fetch prompt config:", error)
    return NextResponse.json(
      { error: "Failed to fetch prompt config" },
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
    const { systemPrompt, userPrompt } = body

    if (!systemPrompt && !userPrompt) {
      return NextResponse.json(
        { error: "At least one prompt field is required" },
        { status: 400 }
      )
    }

    const result = await upsertSequencePromptConfig({
      ...(systemPrompt !== undefined && { systemPrompt }),
      ...(userPrompt !== undefined && { userPrompt }),
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to update prompt config:", error)
    return NextResponse.json(
      { error: "Failed to update prompt config" },
      { status: 500 }
    )
  }
}
