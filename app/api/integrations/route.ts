import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { findAllApiKeys, findApiKeyByService, upsertApiKey } from "@/lib/dal"
import { encrypt } from "@/lib/encryption"
import { logNewsActivity } from "@/lib/news-activity"
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

    const result: Record<string, any> = {}
    for (const key of apiKeys) {
      result[key.service] = {
        status: key.status,
        hasKey: !!key.key,
        // Gemini fields
        geminiModel: key.geminiModel,
        // Resend fields
        resendFromName: key.resendFromName,
        resendFromEmail: key.resendFromEmail,
      }
    }

    // Add missing services
    const services = ["gemini", "resend"]
    for (const service of services) {
      if (!result[service]) {
        result[service] = {
          status: "disconnected",
          hasKey: false,
          geminiModel: service === "gemini" ? "gemini-2.5-flash-preview-05-20" : undefined,
          resendFromName: service === "resend" ? 'Adrian & Jimmy from "AI Product Briefing"' : undefined,
          resendFromEmail: service === "resend" ? "hello@jimmy-iliohan.com" : undefined,
        }
      }
    }

    return NextResponse.json(result)
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
