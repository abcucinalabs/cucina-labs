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

        // Update contact to set unsubscribed flag
        console.log(`[Unsubscribe] Setting unsubscribed flag for email: ${email}`)
        const updateResponse = await resend.contacts.update({
          email: email,
          unsubscribed: true,
        })

        console.log(`[Unsubscribe] Update response:`, updateResponse)

        if (updateResponse.data) {
          unsubscribedInResend = true
          console.log(`[Unsubscribe] Successfully unsubscribed ${email} in Resend`)
        } else if (updateResponse.error) {
          console.error(`[Unsubscribe] Failed to unsubscribe in Resend:`, updateResponse.error)
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

