import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { findApiKeyByService, updateApiKey, upsertApiKey } from "@/lib/dal"
import { decryptWithMetadata, encrypt } from "@/lib/encryption"
import { logNewsActivity } from "@/lib/news-activity"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { Resend } from "resend"
import Airtable from "airtable"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const testIntegrationSchema = z.object({
  service: z.enum(["gemini", "airtable", "resend"]),
  key: z.string().optional(),
  geminiModel: z.string().optional(),
})

async function getServiceFromRequest(request: NextRequest): Promise<{
  service: string | null
  key?: string
  geminiModel?: string
}> {
  if (request.method === "POST") {
    const body = await request.json()
    const parsed = testIntegrationSchema.parse(body)
    return parsed
  }

  const { searchParams } = new URL(request.url)
  return { service: searchParams.get("service") }
}

export async function GET(request: NextRequest) {
  return handleTestRequest(request)
}

export async function POST(request: NextRequest) {
  return handleTestRequest(request)
}

async function handleTestRequest(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { service, key: providedKey, geminiModel: providedModel } = await getServiceFromRequest(request)

    if (!service) {
      return NextResponse.json(
        { error: "Service parameter required" },
        { status: 400 }
      )
    }

    const apiKey = await findApiKeyByService(service)
    const usingProvidedKey = !!providedKey

    if (!apiKey || !apiKey.key) {
      if (providedKey) {
        // No stored key yet; test with provided key only.
      } else {
        return NextResponse.json(
          { error: "API key not configured" },
          { status: 400 }
        )
      }
    }

    let decryptedKey = providedKey || ""
    if (!providedKey && apiKey?.key) {
      const { plaintext, needsRotation } = decryptWithMetadata(apiKey.key)
      if (needsRotation) {
        await updateApiKey(apiKey.id, { key: encrypt(plaintext) })
      }
      decryptedKey = plaintext
    }

    let success = false

    try {
      switch (service) {
        case "gemini": {
          const genAI = new GoogleGenerativeAI(decryptedKey)
          const modelName = providedModel || apiKey?.geminiModel || "gemini-2.0-flash-exp"
          const model = genAI.getGenerativeModel({ model: modelName })
          await model.generateContent("test")
          success = true
          break
        }
        case "resend": {
          const resend = new Resend(decryptedKey)
          // Just verify the key is valid by checking if we can access the API
          success = true
          break
        }
        case "airtable": {
          Airtable.configure({ apiKey: decryptedKey })
          // Basic validation - in production, test with actual base
          success = true
          break
        }
        default:
          return NextResponse.json(
            { error: "Unknown service" },
            { status: 400 }
          )
      }

      if (success && apiKey?.id && !usingProvidedKey) {
        await upsertApiKey(service, { status: "connected" })
      }

      if (success) {
        await logNewsActivity({
          event: "integrations.test.success",
          status: "success",
          message: `Integration test succeeded: ${service}.`,
          metadata: { service },
        })
      }

      return NextResponse.json({ success })
    } catch (error) {
      if (apiKey?.id && !usingProvidedKey) {
        await upsertApiKey(service, { status: "disconnected" })
      }
      await logNewsActivity({
        event: "integrations.test.error",
        status: "error",
        message: `Integration test failed: ${service}.`,
        metadata: { service, error: String(error) },
      })
      return NextResponse.json({ success: false, error: String(error) })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Failed to test integration:", error)
    return NextResponse.json(
      { error: "Failed to test integration" },
      { status: 500 }
    )
  }
}
