import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { encrypt, decrypt } from "@/lib/encryption"
import { logNewsActivity } from "@/lib/news-activity"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const saveIntegrationSchema = z.object({
  service: z.enum(["gemini", "airtable", "resend"]),
  key: z.string().optional(),
  // Gemini fields
  geminiModel: z.string().optional(),
  // Airtable fields
  airtableBaseId: z.string().optional(),
  airtableBaseName: z.string().optional(),
  airtableTableId: z.string().optional(),
  airtableTableName: z.string().optional(),
  // Resend fields
  resendFromName: z.string().optional(),
  resendFromEmail: z.string().email().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKeys = await prisma.apiKey.findMany()

    const result: Record<string, any> = {}
    for (const key of apiKeys) {
      result[key.service] = {
        status: key.status,
        hasKey: !!key.key,
        // Gemini fields
        geminiModel: key.geminiModel,
        // Airtable fields
        airtableBaseId: key.airtableBaseId,
        airtableBaseName: key.airtableBaseName,
        airtableTableId: key.airtableTableId,
        airtableTableName: key.airtableTableName,
        // Resend fields
        resendFromName: key.resendFromName,
        resendFromEmail: key.resendFromEmail,
      }
    }

    // Add missing services
    const services = ["gemini", "airtable", "resend"]
    for (const service of services) {
      if (!result[service]) {
        result[service] = { 
          status: "disconnected", 
          hasKey: false,
          geminiModel: service === "gemini" ? "gemini-2.0-flash-exp" : undefined,
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
    const session = await getServerSession(authOptions)
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
    const existing = await prisma.apiKey.findUnique({ where: { service } })
    
    if (existing) {
      await prisma.apiKey.update({
        where: { service },
        data: updateData,
      })
    } else {
      // If creating new, a key is required
      if (!key) {
        return NextResponse.json(
          { error: "API key is required for new integrations" },
          { status: 400 }
        )
      }
      await prisma.apiKey.create({
        data: {
          service,
          key: encrypt(key),
          status: "connected",
          ...configFields,
        },
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
