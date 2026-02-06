import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { findAllApiKeys, findApiKeyByService, upsertApiKey } from "@/lib/dal"
import { encrypt } from "@/lib/encryption"
import { logNewsActivity } from "@/lib/news-activity"
import { getServiceApiKey } from "@/lib/service-keys"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const saveIntegrationSchema = z.object({
  service: z.enum(["gemini", "resend"]),
  key: z.string().optional(),
  // Gemini fields
  geminiModel: z.string().optional(),
  // Resend fields
  resendFromName: z.string().optional(),
  resendFromEmail: z.string().email().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKeys = await findAllApiKeys()

    // Check if valid API keys exist using the same method as health check
    const [geminiKey, resendKey] = await Promise.all([
      getServiceApiKey("gemini"),
      getServiceApiKey("resend"),
    ])

    const keysByService = new Map(apiKeys.map((k) => [k.service, k]))

    const result: Record<string, any> = {}

    // Gemini
    const geminiRecord = keysByService.get("gemini")
    result.gemini = {
      status: geminiKey ? "connected" : "disconnected",
      hasKey: !!geminiKey,
      geminiModel: geminiRecord?.geminiModel || "gemini-2.5-flash",
    }

    // Resend
    const resendRecord = keysByService.get("resend")
    result.resend = {
      status: resendKey ? "connected" : "disconnected",
      hasKey: !!resendKey,
      resendFromName: resendRecord?.resendFromName || 'Adrian & Jimmy from "AI Product Briefing"',
      resendFromEmail: resendRecord?.resendFromEmail || "hello@jimmy-iliohan.com",
    }

    const response = NextResponse.json(result)
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
    return response
  } catch (error) {
    console.error("Failed to fetch integrations:", error)
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
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
    const validatedData = saveIntegrationSchema.parse(body)
    const { service, key, ...configFields } = validatedData

    // Build update data
    const updateData: any = { ...configFields }

    // Only update the key if one is provided
    if (key) {
      updateData.key = encrypt(key)
      updateData.status = "connected"
    }

    // Check if we're updating an existing record or creating new
    const existing = await findApiKeyByService(service)

    if (existing) {
      await upsertApiKey(service, updateData)
    } else {
      // If creating new, a key is required
      if (!key) {
        return NextResponse.json(
          { error: "API key is required for new integrations" },
          { status: 400 }
        )
      }
      await upsertApiKey(service, {
        key: encrypt(key),
        status: "connected",
        ...configFields,
      })
    }

    await logNewsActivity({
      event: "integrations.saved",
      status: "success",
      message: `Integration saved: ${service}.`,
      metadata: { service },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to save integration:", error)
    await logNewsActivity({
      event: "integrations.error",
      status: "error",
      message: "Failed to save integration.",
      metadata: { error: String(error) },
    })
    return NextResponse.json(
      { error: "Failed to save integration" },
      { status: 500 }
    )
  }
}
