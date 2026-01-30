import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decryptWithMetadata, encrypt } from "@/lib/encryption"
import { Resend } from "resend"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const sendAdhocSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  html: z.string().min(1, "HTML content is required"),
  emails: z.array(z.string().email()).optional(),
  audienceId: z.string().optional(),
}).refine(data => data.emails?.length || data.audienceId, {
  message: "Either emails or audienceId must be provided",
})

async function getResendConfig() {
  const apiKey = await prisma.apiKey.findUnique({
    where: { service: "resend" },
  })
  if (!apiKey || !apiKey.key) return null

  const { plaintext, needsRotation } = decryptWithMetadata(apiKey.key)
  if (needsRotation) {
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { key: encrypt(plaintext) },
    })
  }
  return {
    apiKey: plaintext,
    fromName: apiKey.resendFromName || "cucina labs",
    fromEmail: apiKey.resendFromEmail || "newsletter@cucinalabs.com",
  }
}

async function fetchResendAllContactsAudienceId(apiKey: string) {
  const response = await fetch("https://api.resend.com/audiences", {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!response.ok) return null

  const data = await response.json()
  const allContactsAudience = (data?.data || []).find(
    (audience: { name?: string }) =>
      audience.name?.toLowerCase() === "all contacts"
  )
  return allContactsAudience?.id || null
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { subject, html, emails, audienceId } = sendAdhocSchema.parse(body)

    const resendConfig = await getResendConfig()
    if (!resendConfig) {
      return NextResponse.json(
        { error: "Resend is not configured. Please set up Resend integration first." },
        { status: 400 }
      )
    }

    const resend = new Resend(resendConfig.apiKey)
    const from = `${resendConfig.fromName} <${resendConfig.fromEmail}>`

    // Send to specific email addresses
    if (emails && emails.length > 0) {
      if (emails.length === 1) {
        // Single email
        const result = await resend.emails.send({
          from,
          to: emails[0],
          subject,
          html,
        })

        if (result.error) {
          return NextResponse.json(
            { error: `Failed to send email: ${result.error.message}` },
            { status: 500 }
          )
        }

        return NextResponse.json({ success: true, count: 1 })
      } else {
        // Batch send for multiple emails
        const emailPayloads = emails.map(email => ({
          from,
          to: email,
          subject,
          html,
        }))

        const result = await resend.batch.send(emailPayloads)

        if (result.error) {
          return NextResponse.json(
            { error: `Failed to send emails: ${result.error.message}` },
            { status: 500 }
          )
        }

        return NextResponse.json({ success: true, count: emails.length })
      }
    }

    // Send to audience via broadcast
    if (audienceId) {
      // Handle "resend_all" special case
      const targetAudienceId = audienceId === "resend_all"
        ? await fetchResendAllContactsAudienceId(resendConfig.apiKey)
        : audienceId

      if (!targetAudienceId) {
        return NextResponse.json(
          { error: "Could not find the target audience" },
          { status: 400 }
        )
      }

      // Create and send broadcast
      const broadcastResponse = await resend.broadcasts.create({
        name: `Ad Hoc: ${subject} - ${new Date().toISOString()}`,
        audienceId: targetAudienceId,
        from,
        subject,
        html,
      })

      if (broadcastResponse.error || !broadcastResponse.data?.id) {
        return NextResponse.json(
          { error: `Failed to create broadcast: ${broadcastResponse.error?.message || "Unknown error"}` },
          { status: 500 }
        )
      }

      const broadcastId = broadcastResponse.data.id

      const sendResponse = await resend.broadcasts.send(broadcastId)
      if (sendResponse.error) {
        return NextResponse.json(
          { error: `Failed to send broadcast: ${sendResponse.error?.message || "Unknown error"}` },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        broadcastId,
        message: "Broadcast sent to audience"
      })
    }

    return NextResponse.json(
      { error: "No recipients specified" },
      { status: 400 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to send ad hoc email:", error)
    return NextResponse.json(
      { error: "Failed to send email", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
