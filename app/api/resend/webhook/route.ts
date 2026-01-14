import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

const getSignature = (request: NextRequest) =>
  request.headers.get("resend-signature") ||
  request.headers.get("x-resend-signature") ||
  ""

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = getSignature(request)
    const secret = process.env.RESEND_WEBHOOK_SECRET

    if (secret) {
      const expected = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex")

      if (!signature || signature !== expected) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const payload = JSON.parse(rawBody || "{}")
    const eventType = payload.type || payload.event || "unknown"
    const data = payload.data || {}
    const eventId = payload.id || data.id || null
    const emailId = data.email_id || data.emailId || null
    const broadcastId = data.broadcast_id || data.broadcastId || null
    const to = Array.isArray(data.to) ? data.to.join(", ") : data.to || null
    const subject = data.subject || null
    const clickUrl = data.url || data.link || null
    const createdAt = payload.created_at || data.created_at || null

    await prisma.emailEvent.create({
      data: {
        eventId: eventId || undefined,
        eventType: String(eventType),
        emailId: emailId ? String(emailId) : undefined,
        broadcastId: broadcastId ? String(broadcastId) : undefined,
        recipient: to ? String(to) : undefined,
        subject: subject ? String(subject) : undefined,
        clickUrl: clickUrl ? String(clickUrl) : undefined,
        payload,
        createdAt: createdAt ? new Date(createdAt) : undefined,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to handle Resend webhook:", error)
    return NextResponse.json({ error: "Failed to handle webhook" }, { status: 500 })
  }
}
