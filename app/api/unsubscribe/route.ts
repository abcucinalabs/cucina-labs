import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/encryption"
import { Resend } from "resend"
import crypto from "crypto"
import { z } from "zod"

const unsubscribeSchema = z.object({
  email: z.string().email(),
  token: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token } = unsubscribeSchema.parse(body)

    // Verify token (HMAC)
    const secret = process.env.NEXTAUTH_SECRET || ""
    const expectedToken = crypto
      .createHmac("sha256", secret)
      .update(email)
      .digest("hex")

    if (token !== expectedToken) {
      return NextResponse.json(
        { error: "Invalid unsubscribe token" },
        { status: 403 }
      )
    }

    // Get Resend API key from database
    const resendConfig = await prisma.apiKey.findUnique({
      where: { service: "resend" },
    })

    let unsubscribedInResend = false

    if (resendConfig && resendConfig.key) {
      try {
        const resendApiKey = decrypt(resendConfig.key)
        const resend = new Resend(resendApiKey)

        // Get all audiences to find the contact
        console.log(`[Unsubscribe] Finding contact for email: ${email}`)
        const audiencesResponse = await resend.audiences.list()
        const audiences = audiencesResponse.data?.data || []

        // Find the contact in any audience and update it
        for (const audience of audiences) {
          try {
            const contactsResponse = await resend.contacts.list({
              audienceId: audience.id,
            })

            const contacts = contactsResponse.data?.data || []
            const contact = contacts.find((c) => c.email === email)

            if (contact) {
              console.log(`[Unsubscribe] Found contact in audience ${audience.name}, updating unsubscribed flag`)
              const updateResponse = await resend.contacts.update({
                audienceId: audience.id,
                id: contact.id,
                unsubscribed: true,
              })

              console.log(`[Unsubscribe] Update response:`, updateResponse)

              if (updateResponse.data) {
                unsubscribedInResend = true
                console.log(`[Unsubscribe] Successfully unsubscribed ${email} in Resend`)
                break // Contact updated, no need to check other audiences
              }
            }
          } catch (error) {
            console.error(`[Unsubscribe] Error updating contact in audience ${audience.id}:`, error)
          }
        }

        if (!unsubscribedInResend) {
          console.log(`[Unsubscribe] Contact ${email} not found in any audience`)
        }
      } catch (error) {
        console.error("[Unsubscribe] Failed to process Resend unsubscribe:", error)
      }
    } else {
      console.log("[Unsubscribe] No Resend config found or no API key")
    }

    // Update local database status
    await prisma.subscriber.updateMany({
      where: { email },
      data: { status: "unsubscribed" },
    })

    return NextResponse.json({
      success: true,
      message: unsubscribedInResend
        ? "Successfully unsubscribed from all Cucina Labs emails"
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

