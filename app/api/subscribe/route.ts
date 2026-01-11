import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Resend } from "resend"
import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/encryption"

const REQUEST_SPACING_MS = 650
const WELCOME_EMAIL_RETRY_DELAY_MS = 1200

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export async function POST(request: NextRequest) {
  try {
    const resendConfig = await prisma.apiKey.findUnique({
      where: { service: "resend" },
    })

    if (!resendConfig?.key) {
      return NextResponse.json(
        {
          error: "Email signup isn't configured yet. Please try again later.",
          code: "resend_not_configured",
        },
        { status: 503 }
      )
    }

    const resend = new Resend(decrypt(resendConfig.key))
    const body = await request.json()
    const subscribeSchema = z.object({
      email: z.string().trim().email(),
    })
    const { email } = subscribeSchema.parse(body)

    let welcomeEmailSent = false
    let welcomeEmailError: string | null = null

    try {
      const audienceName = "Website Subscribers"
      const audiences = await resend.audiences.list()
      if (audiences.error || !audiences.data?.data) {
        throw new Error("Failed to fetch audiences from Resend")
      }

      let audienceId =
        audiences.data.data.find((audience) => audience.name === audienceName)?.id ||
        audiences.data.data[0]?.id

      if (!audienceId) {
        await sleep(REQUEST_SPACING_MS)
        const createdAudience = await resend.audiences.create({ name: audienceName })
        if (createdAudience.error || !createdAudience.data?.id) {
          throw new Error("Failed to create Resend audience")
        }
        audienceId = createdAudience.data.id
      }

      await sleep(REQUEST_SPACING_MS)
      await resend.contacts.create({ email, audienceId })

      const welcomeTemplate = await prisma.emailTemplate.findUnique({
        where: { type: "welcome" },
      })

      if (welcomeTemplate?.enabled) {
        if (!welcomeTemplate.html) {
          welcomeEmailError = "Welcome email is enabled but the template is empty."
        } else {
          const fromName = resendConfig.resendFromName || "cucina labs"
          const fromEmail =
            resendConfig.resendFromEmail || "newsletter@cucinalabs.com"
          const emailPayload = {
            from: `${fromName} <${fromEmail}>`,
            to: email,
            subject: welcomeTemplate.subject || "Welcome to cucina labs",
            html: welcomeTemplate.html,
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

      console.error("Failed to add to Resend:", resendError)
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
