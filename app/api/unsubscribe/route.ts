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

    let removedFromAudiences = 0

    if (resendConfig && resendConfig.key) {
      try {
        const resendApiKey = decrypt(resendConfig.key)
        const resend = new Resend(resendApiKey)

        // Get all audiences
        console.log(`[Unsubscribe Debug] Fetching audiences for email: ${email}`)
        const audiencesResponse = await resend.audiences.list()
        const audiences = audiencesResponse.data?.data || []
        console.log(`[Unsubscribe Debug] Found ${audiences.length} audiences:`, audiences.map(a => ({ id: a.id, name: a.name })))

        // Remove contact from all audiences
        for (const audience of audiences) {
          try {
            console.log(`[Unsubscribe Debug] Checking audience: ${audience.name} (${audience.id})`)

            // Get contacts in this audience
            const contactsResponse = await resend.contacts.list({
              audienceId: audience.id,
            })

            const contacts = contactsResponse.data?.data || []
            console.log(`[Unsubscribe Debug] Found ${contacts.length} contacts in audience ${audience.name}`)
            console.log(`[Unsubscribe Debug] Contact emails:`, contacts.map(c => c.email))

            const contact = contacts.find((c) => c.email === email)
            console.log(`[Unsubscribe Debug] Contact match for ${email}:`, contact ? `Found (ID: ${contact.id})` : 'Not found')

            if (contact) {
              // Remove the contact from this audience
              console.log(`[Unsubscribe Debug] Attempting to remove contact ${contact.id} from audience ${audience.id}`)
              const removeResponse = await resend.contacts.remove({
                audienceId: audience.id,
                id: contact.id,
              })
              console.log(`[Unsubscribe Debug] Remove response:`, removeResponse)
              removedFromAudiences++
              console.log(`[Unsubscribe Debug] Successfully removed ${email} from audience: ${audience.name}`)
            }
          } catch (error) {
            console.error(`[Unsubscribe Debug] Failed to remove from audience ${audience.id}:`, error)
          }
        }

        console.log(`[Unsubscribe Debug] Total audiences removed from: ${removedFromAudiences}`)
      } catch (error) {
        console.error("[Unsubscribe Debug] Failed to process Resend unsubscribe:", error)
      }
    } else {
      console.log("[Unsubscribe Debug] No Resend config found or no API key")
    }

    // Update local database status
    await prisma.subscriber.updateMany({
      where: { email },
      data: { status: "unsubscribed" },
    })

    return NextResponse.json({
      success: true,
      message: removedFromAudiences > 0
        ? `Successfully unsubscribed from ${removedFromAudiences} audience(s)`
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

