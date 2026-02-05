import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import {
  findIngestionConfig,
  upsertIngestionConfig,
} from "@/lib/dal"
import { logNewsActivity } from "@/lib/news-activity"
import { DEFAULT_PROMPTS } from "@/lib/prompt-defaults"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const configSchema = z.object({
  schedule: z.array(z.string()),
  time: z.string(),
  timezone: z.string(),
  timeFrame: z.number(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the first (and should be only) config
    const config = await findIngestionConfig()

    if (!config) {
      return NextResponse.json(null)
    }

    return NextResponse.json({
      schedule: config.schedule,
      time: config.time,
      timezone: config.timezone,
      timeFrame: config.timeFrame,
      promptKey: "ingestion",
    })
  } catch (error) {
    console.error("Failed to fetch config:", error)
    return NextResponse.json(
      { error: "Failed to fetch config" },
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
    const data = configSchema.parse(body)
    const existingConfig = await findIngestionConfig()

    await upsertIngestionConfig({
      schedule: data.schedule,
      time: data.time,
      timezone: data.timezone,
      timeFrame: data.timeFrame,
      ...(existingConfig
        ? {}
        : {
            systemPrompt: "",
            userPrompt: DEFAULT_PROMPTS.ingestion,
          }),
    })

    await logNewsActivity({
      event: "ingestion.config.saved",
      status: "success",
      message: "Ingestion configuration saved.",
      metadata: { user: session.user?.email },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to save config:", error)
    await logNewsActivity({
      event: "ingestion.config.error",
      status: "error",
      message: "Failed to save ingestion configuration.",
      metadata: { error: String(error) },
    })
    return NextResponse.json(
      { error: "Failed to save config" },
      { status: 500 }
    )
  }
}
