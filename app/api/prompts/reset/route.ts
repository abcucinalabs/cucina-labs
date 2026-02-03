import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { DEFAULT_PROMPTS, extractPromptVariables, type PromptKey } from "@/lib/prompt-defaults"
import {
  findIngestionConfig,
  upsertIngestionConfig,
  upsertSequencePromptConfig,
  upsertWeeklyPromptConfig,
} from "@/lib/dal"
import { z } from "zod"

const resetSchema = z.object({
  key: z.enum(["ingestion", "daily_insights", "weekly_update"]),
})

export const dynamic = "force-dynamic"

const defaultIngestionConfig = {
  schedule: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  time: "09:00",
  timezone: "America/New_York",
  timeFrame: 72,
}

async function saveDefaultPrompt(key: PromptKey, prompt: string) {
  if (key === "ingestion") {
    const existing = await findIngestionConfig()
    return upsertIngestionConfig({
      ...(existing
        ? {
            schedule: existing.schedule,
            time: existing.time,
            timezone: existing.timezone,
            timeFrame: existing.timeFrame,
          }
        : defaultIngestionConfig),
      systemPrompt: "",
      userPrompt: prompt,
    })
  }

  if (key === "daily_insights") {
    return upsertSequencePromptConfig({
      systemPrompt: "",
      userPrompt: prompt,
    })
  }

  return upsertWeeklyPromptConfig({
    promptText: prompt,
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { key } = resetSchema.parse(body)
    const prompt = DEFAULT_PROMPTS[key as PromptKey]
    await saveDefaultPrompt(key as PromptKey, prompt)

    return NextResponse.json({
      success: true,
      key,
      prompt,
      isDefault: true,
      variables: extractPromptVariables(prompt),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Failed to reset prompt:", error)
    return NextResponse.json({ error: "Failed to reset prompt" }, { status: 500 })
  }
}
