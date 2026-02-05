import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import {
  findIngestionConfig,
  upsertIngestionConfig,
  findSequencePromptConfig,
  upsertSequencePromptConfig,
  findWeeklyPromptConfig,
  upsertWeeklyPromptConfig,
} from "@/lib/dal"
import {
  DEFAULT_PROMPTS,
  extractPromptVariables,
  PROMPT_DEFINITIONS,
  type PromptKey,
} from "@/lib/prompt-defaults"
import { z } from "zod"

export const dynamic = "force-dynamic"

const updatePromptSchema = z.object({
  key: z.enum(["ingestion", "daily_insights", "weekly_update"]),
  prompt: z.string().min(1),
})

const defaultIngestionConfig = {
  schedule: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  time: "09:00",
  timezone: "America/New_York",
  timeFrame: 72,
}

async function loadPromptValue(key: PromptKey): Promise<{ prompt: string | null; isDefault: boolean }> {
  if (key === "ingestion") {
    let config: any = null
    try {
      config = await findIngestionConfig()
    } catch {
      // table may not exist yet
    }
    // Only return the prompt if it's been manually set (userPrompt exists)
    const prompt = config?.userPrompt || null
    return { prompt, isDefault: !prompt }
  }

  if (key === "daily_insights") {
    let config: any = null
    try {
      config = await findSequencePromptConfig()
    } catch {
      // table may not exist yet
    }
    // Only return the prompt if it's been manually set (userPrompt exists)
    const prompt = config?.userPrompt || null
    return { prompt, isDefault: !prompt }
  }

  let config: any = null
  try {
    config = await findWeeklyPromptConfig()
  } catch {
    // table may not exist yet
  }
  // Only return the prompt if it's been manually set (promptText exists)
  const prompt = config?.promptText || null
  return { prompt, isDefault: !prompt }
}

async function savePromptValue(key: PromptKey, prompt: string) {
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

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const keyParam = request.nextUrl.searchParams.get("key")
    if (keyParam) {
      const key = z.enum(["ingestion", "daily_insights", "weekly_update"]).parse(keyParam)
      const def = PROMPT_DEFINITIONS[key]
      const { prompt, isDefault } = await loadPromptValue(key)
      return NextResponse.json({
        key,
        label: def.label,
        description: def.description,
        prompt,
        isDefault,
        variables: prompt ? extractPromptVariables(prompt) : [],
      })
    }

    const keys: PromptKey[] = ["ingestion", "daily_insights", "weekly_update"]
    const prompts = await Promise.all(
      keys.map(async (key) => {
        const def = PROMPT_DEFINITIONS[key]
        const { prompt, isDefault } = await loadPromptValue(key)
        return {
          key,
          label: def.label,
          description: def.description,
          prompt,
          isDefault,
          variables: prompt ? extractPromptVariables(prompt) : [],
        }
      })
    )

    return NextResponse.json({ prompts })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid prompt key" }, { status: 400 })
    }
    console.error("Failed to fetch prompts:", error)
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { key, prompt } = updatePromptSchema.parse(body)

    await savePromptValue(key, prompt)
    return NextResponse.json({
      success: true,
      key,
      isDefault: prompt === DEFAULT_PROMPTS[key],
      variables: extractPromptVariables(prompt),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Failed to save prompt:", error)
    return NextResponse.json({ error: "Failed to save prompt" }, { status: 500 })
  }
}
