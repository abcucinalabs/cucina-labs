import { NextRequest, NextResponse } from "next/server"
import { findApiKeyByService, updateApiKey, updateSubscribersByEmail } from "@/lib/dal"
import { decryptWithMetadata, encrypt } from "@/lib/encryption"
import { Resend } from "resend"
import crypto from "crypto"
import { z } from "zod"
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit"

const unsubscribeSchema = z.object({
  email: z.string().email(),
  token: z.string().optional(),
  exp: z.string().optional(), // Expiration timestamp (optional for backward compatibility)
})

export async function POST(request: NextRequest) {
  // Apply rate limiting: 10 unsubscribe attempts per 15 minutes per IP
  const rateLimitResponse = rateLimit(request, RateLimitPresets.MODERATE, "unsubscribe")
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json()
    const { email, token, exp } = unsubscribeSchema.parse(body)
    const normalizedEmail = email.trim().toLowerCase()

    if (token) {
      const secret = process.env.UNSUBSCRIBE_SECRET || ""

      // Verify token with expiration check
      let expectedToken: string

      if (exp) {
        // New format: token includes timestamp for expiration
        const expirationTimestamp = parseInt(exp, 10)

        // Check if token has expired
        const now = Math.floor(Date.now() / 1000)
        if (now > expirationTimestamp) {
          return NextResponse.json(
            { error: "Unsubscribe link has expired. Please contact support." },
            { status: 403 }
          )
        }

        // Verify token with normalized email and timestamp
        const payload = `${normalizedEmail}:${exp}`
        expectedToken = crypto
          .createHmac("sha256", secret)
          .update(payload)
          .digest("hex")
      } else {
        // Old format: token without expiration (for backward compatibility)
        expectedToken = crypto
          .createHmac("sha256", secret)
          .update(email)
          .digest("hex")
      }

      if (token !== expectedToken) {
        return NextResponse.json(
          { error: "Invalid unsubscribe token" },
          { status: 403 }
        )
      }
    }

    // Get Resend API key from database
    const resendConfig = await findApiKeyByService("resend")

    let unsubscribedInResend = false

    if (resendConfig && resendConfig.key) {
      try {
        const { plaintext, needsRotation } = decryptWithMetadata(resendConfig.key)
        if (needsRotation) {
          await updateApiKey(resendConfig.id, { key: encrypt(plaintext) })
        }
        const resendApiKey = plaintext
        const resend = new Resend(resendApiKey)

        // Get all audiences to find the contact
        console.log(`[Unsubscribe] Finding contact for email: ${normalizedEmail}`)
        const audiencesResponse = await resend.audiences.list()
        const audiences = audiencesResponse.data?.data || []
        console.log(`[Unsubscribe] Audiences available: ${audiences.length}`)

        // Find the contact in any audience and update it
        for (const audience of audiences) {
          try {
            // Try to update by email directly to avoid contact list pagination issues.
            const updateResponse = await resend.contacts.update({
              audienceId: audience.id,
              email: normalizedEmail,
              unsubscribed: true,
            })

            console.log(
              `[Unsubscribe] Update response for audience ${audience.name}:`,
              updateResponse
            )

            if (updateResponse.data) {
              unsubscribedInResend = true
              console.log(
                `[Unsubscribe] Successfully unsubscribed ${normalizedEmail} in Resend`
              )
              break // Contact updated, no need to check other audiences
            }
          } catch (error) {
            console.error(
              `[Unsubscribe] Error updating contact in audience ${audience.id}:`,
              error
            )
          }
        }

        if (!unsubscribedInResend) {
          console.log(
            `[Unsubscribe] Contact ${normalizedEmail} not found in any audience`
          )
        }
      } catch (error) {
        console.error("[Unsubscribe] Failed to process Resend unsubscribe:", error)
      }
    } else {
      console.log("[Unsubscribe] No Resend config found or no API key")
    }

    // Update local database status
    await updateSubscribersByEmail(email, { status: "unsubscribed" })

    return NextResponse.json({
      success: true,
      message: unsubscribedInResend
        ? "Successfully unsubscribed from all cucina labs emails"
        : "Successfully unsubscribed",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }

    console.error("Failed to unsubscribe:", error)
    return NextResponse.json(
      { error: "Failed to unsubscribe", details: String(error) },
      { status: 500 }
    )
  }
}
