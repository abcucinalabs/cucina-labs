import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Resend } from "resend"
import { findApiKeyByService, updateApiKey, findEmailTemplateByType } from "@/lib/dal"
import { decryptWithMetadata, encrypt } from "@/lib/encryption"
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit"
import { appendEmailFooter } from "@/lib/email-footer"

// Handle GET requests (e.g., from prefetch, crawlers) with proper error
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to subscribe." },
    { status: 405 }
  )
}

const REQUEST_SPACING_MS = 650
const WELCOME_EMAIL_RETRY_DELAY_MS = 1200

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export async function POST(request: NextRequest) {
  // Apply rate limiting: 5 signups per 15 minutes per IP
  const rateLimitResponse = rateLimit(request, RateLimitPresets.STRICT, "subscribe")
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const resendConfig = await findApiKeyByService("resend")

    if (!resendConfig?.key) {
      return NextResponse.json(
        {
          error: "Email signup isn't configured yet. Please try again later.",
          code: "resend_not_configured",
        },
        { status: 503 }
      )
    }

    const { plaintext, needsRotation } = decryptWithMetadata(resendConfig.key)
    if (needsRotation) {
      await updateApiKey(resendConfig.id, { key: encrypt(plaintext) })
    }
    const resend = new Resend(plaintext)
    const body = await request.json()
    const subscribeSchema = z.object({
      email: z.string().trim().email(),
    })
    const { email } = subscribeSchema.parse(body)

    let welcomeEmailSent = false
    let welcomeEmailError: string | null = null

    try {
      // Create contact in Resend without adding to a specific segment
      // Resend's new contacts API (2024) allows creating contacts without an audienceId
      const contactResult = await resend.contacts.create({ email })

      // Check if contact creation failed (but not for "already exists" which is OK)
      if (contactResult.error) {
        const errorMessage = contactResult.error.message?.toLowerCase() || ""
        // If contact already exists, that's fine - continue to welcome email
        if (!errorMessage.includes("already") && !errorMessage.includes("exists") && !errorMessage.includes("duplicate")) {
          console.error("Failed to create contact:", contactResult.error)
          throw new Error(contactResult.error.message || "Failed to add contact")
        }
        // Contact already exists - this is OK, user might just want another welcome email
        console.log("Contact already exists:", email)
      }

      const welcomeTemplate = await findEmailTemplateByType("welcome")

      if (welcomeTemplate?.enabled) {
        if (!welcomeTemplate.html) {
          welcomeEmailError = "Welcome email is enabled but the template is empty."
        } else {
          const fromName = resendConfig.resendFromName || "cucina labs"
          const fromEmail =
            resendConfig.resendFromEmail || "newsletter@cucinalabs.com"

          // IMPORTANT: Append CAN-SPAM compliant footer to welcome email
          const htmlWithFooter = appendEmailFooter(welcomeTemplate.html, {
            email,
            includeUnsubscribe: true,
            origin: process.env.NEXT_PUBLIC_BASE_URL,
          })

          const emailPayload = {
            from: `${fromName} <${fromEmail}>`,
            to: email,
            subject: welcomeTemplate.subject || "Welcome to cucina labs",
            html: htmlWithFooter,
          }

          for (let attempt = 0; attempt < 2; attempt += 1) {
            if (attempt > 0) {
              await sleep(WELCOME_EMAIL_RETRY_DELAY_MS)
            } else {
              await sleep(REQUEST_SPACING_MS)
            }

            try {
              const emailResponse = await resend.emails.send(emailPayload)
              if (emailResponse.error) {
                welcomeEmailError = emailResponse.error.message
              } else {
                welcomeEmailSent = true
                welcomeEmailError = null
                break
              }
            } catch (emailError) {
              welcomeEmailError =
                emailError instanceof Error ? emailError.message : "Unknown error"
            }
          }
        }

        if (welcomeEmailError) {
          console.error("Failed to send welcome email:", welcomeEmailError)
        }
      }
    } catch (resendError) {
      const message =
        resendError instanceof Error ? resendError.message : "Failed to subscribe"
      const normalized = message.toLowerCase()

      if (normalized.includes("already") || normalized.includes("exists")) {
        return NextResponse.json(
          { error: "You're already subscribed.", code: "already_subscribed" },
          { status: 409 }
        )
      }

      console.error("Failed to add to Resend:", {
        error: resendError,
        message,
        email,
      })
      return NextResponse.json(
        {
          error: "We couldn't add you right now. Please try again in a minute.",
          code: "resend_failed",
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      welcomeEmailSent,
      welcomeEmailError,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address", code: "invalid_email" },
        { status: 400 }
      )
    }

    console.error("Subscribe error:", error)
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 }
    )
  }
}
