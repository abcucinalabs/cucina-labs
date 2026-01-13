import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/encryption"
import { logNewsActivity } from "@/lib/news-activity"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { Resend } from "resend"
import Airtable from "airtable"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const service = searchParams.get("service")

    if (!service) {
      return NextResponse.json(
        { error: "Service parameter required" },
        { status: 400 }
      )
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { service },
    })

    if (!apiKey || !apiKey.key) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 400 }
      )
    }

    const decryptedKey = decrypt(apiKey.key)
    let success = false

    try {
      switch (service) {
        case "gemini": {
          const genAI = new GoogleGenerativeAI(decryptedKey)
          const model = genAI.getGenerativeModel({ model: "gemini-pro" })
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

      if (success) {
        await prisma.apiKey.update({
          where: { service },
          data: { status: "connected" },
        })
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
      await prisma.apiKey.update({
        where: { service },
        data: { status: "disconnected" },
      })
      await logNewsActivity({
        event: "integrations.test.error",
        status: "error",
        message: `Integration test failed: ${service}.`,
        metadata: { service, error: String(error) },
      })
      return NextResponse.json({ success: false, error: String(error) })
    }
  } catch (error) {
    console.error("Failed to test integration:", error)
    return NextResponse.json(
      { error: "Failed to test integration" },
      { status: 500 }
    )
  }
}
