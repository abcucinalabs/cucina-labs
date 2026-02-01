import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { upsertSequencePromptConfig } from "@/lib/dal"
import {
  defaultSequenceSystemPrompt,
  defaultSequenceUserPrompt,
} from "@/lib/sequence-prompt-defaults"

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await upsertSequencePromptConfig({
      systemPrompt: defaultSequenceSystemPrompt,
      userPrompt: defaultSequenceUserPrompt,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to reset prompt config:", error)
    return NextResponse.json(
      { error: "Failed to reset prompt config" },
      { status: 500 }
    )
  }
}
