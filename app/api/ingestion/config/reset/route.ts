import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import {
  findIngestionConfig,
  updateIngestionConfig,
  upsertIngestionConfig,
} from "@/lib/dal"
import { logNewsActivity } from "@/lib/news-activity"
import { DEFAULT_PROMPTS } from "@/lib/prompt-defaults"

export const dynamic = 'force-dynamic'

const defaultSystemPrompt = ""
const defaultUserPrompt = DEFAULT_PROMPTS.ingestion

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get existing config
    const existing = await findIngestionConfig()

    if (existing) {
      await updateIngestionConfig(existing.id, {
        systemPrompt: defaultSystemPrompt,
        userPrompt: defaultUserPrompt,
      })
    } else {
      await upsertIngestionConfig({
        schedule: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        time: "09:00",
        timezone: "America/New_York",
        timeFrame: 72,
        systemPrompt: defaultSystemPrompt,
        userPrompt: defaultUserPrompt,
      })
    }

    await logNewsActivity({
      event: "ingestion.prompts.reset",
      status: "success",
      message: "Ingestion prompts reset to defaults.",
      metadata: { user: session.user?.email },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to reset prompts:", error)
    await logNewsActivity({
      event: "ingestion.prompts.error",
      status: "error",
      message: "Failed to reset ingestion prompts.",
      metadata: { error: String(error) },
    })
    return NextResponse.json(
      { error: "Failed to reset prompts" },
      { status: 500 }
    )
  }
}
