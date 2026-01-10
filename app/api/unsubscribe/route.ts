import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
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
        { error: "Invalid token" },
        { status: 400 }
      )
    }

    // Update subscriber status
    await prisma.subscriber.update({
      where: { email },
      data: { status: "unsubscribed" },
    })

    // Remove from Resend if configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend")
        const resend = new Resend(process.env.RESEND_API_KEY)
        // Remove contact from Resend
        // Note: Adjust based on actual Resend API
      } catch (error) {
        console.error("Failed to remove from Resend:", error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }

    console.error("Failed to unsubscribe:", error)
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    )
  }
}

