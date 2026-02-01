import { NextRequest, NextResponse } from "next/server"
import { findSubscriberByEmail, updateSubscriberByEmail, findApiKeyByService, updateApiKey } from "@/lib/dal"
import { decryptWithMetadata, encrypt } from "@/lib/encryption"
import { Resend } from "resend"
import crypto from "crypto"
import { z } from "zod"
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit"

const getPreferencesSchema = z.object({
  email: z.string().email(),
  token: z.string(),
  exp: z.string(),
})

const updatePreferencesSchema = z.object({
  email: z.string().email(),
  token: z.string(),
  exp: z.string(),
  dailyEnabled: z.boolean(),
  weeklyEnabled: z.boolean(),
})

function verifyToken(email: string, token: string, exp: string): boolean {
  const normalizedEmail = email.trim().toLowerCase()
  const expirationTimestamp = parseInt(exp, 10)
  const now = Math.floor(Date.now() / 1000)
  if (now > expirationTimestamp) return false

  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.NEXTAUTH_SECRET || ""
  const payload = `${normalizedEmail}:${exp}`
  const expectedToken = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  return token === expectedToken
}

// GET - Fetch current preferences
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const email = url.searchParams.get("email")
    const token = url.searchParams.get("token")
    const exp = url.searchParams.get("exp")

    if (!email || !token || !exp) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const parsed = getPreferencesSchema.parse({ email, token, exp })

    if (!verifyToken(parsed.email, parsed.token, parsed.exp)) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 })
    }

    const subscriber = await findSubscriberByEmail(parsed.email.trim().toLowerCase())

    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 })
    }

    return NextResponse.json({
      email: subscriber.email,
      dailyEnabled: subscriber.dailyEnabled,
      weeklyEnabled: subscriber.weeklyEnabled,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    console.error("Failed to fetch preferences:", error)
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 })
  }
}

// POST - Update preferences
export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, RateLimitPresets.MODERATE, "preferences")
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const { email, token, exp, dailyEnabled, weeklyEnabled } = updatePreferencesSchema.parse(body)
    const normalizedEmail = email.trim().toLowerCase()

    if (!verifyToken(email, token, exp)) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 })
    }

    // Update local database
    await updateSubscriberByEmail(normalizedEmail, { dailyEnabled, weeklyEnabled })

    // Update Resend audiences if configured
    const resendConfig = await findApiKeyByService("resend")

    if (resendConfig?.key) {
      try {
        const { plaintext, needsRotation } = decryptWithMetadata(resendConfig.key)
        if (needsRotation) {
          await updateApiKey(resendConfig.id, { key: encrypt(plaintext) })
        }
        const resend = new Resend(plaintext)

        // Get all audiences
        const audiencesResponse = await resend.audiences.list()
        const audiences = audiencesResponse.data?.data || []

        // Look for Daily and Weekly audiences and update subscription status
        for (const audience of audiences) {
          const name = audience.name.toLowerCase()
          const isDaily = name.includes("daily")
          const isWeekly = name.includes("weekly")

          if (isDaily || isWeekly) {
            const shouldBeSubscribed = isDaily ? dailyEnabled : weeklyEnabled
            try {
              await resend.contacts.update({
                audienceId: audience.id,
                email: normalizedEmail,
                unsubscribed: !shouldBeSubscribed,
              })
              console.log(`[Preferences] Updated ${normalizedEmail} in audience "${audience.name}": subscribed=${shouldBeSubscribed}`)
            } catch (err) {
              console.error(`[Preferences] Error updating contact in audience ${audience.name}:`, err)
            }
          }
        }
      } catch (error) {
        console.error("[Preferences] Failed to update Resend:", error)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Your email preferences have been updated.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    console.error("Failed to update preferences:", error)
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
  }
}
