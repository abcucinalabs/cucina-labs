import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { findApiKeyByService, updateApiKey } from "@/lib/dal"
import { decryptWithMetadata, encrypt } from "@/lib/encryption"

export const dynamic = 'force-dynamic'

async function getResendKey() {
  const apiKey = await findApiKeyByService("resend")
  if (!apiKey?.key) return null
  const { plaintext, needsRotation } = decryptWithMetadata(apiKey.key)
  if (needsRotation) {
    await updateApiKey(apiKey.id, { key: encrypt(plaintext) })
  }
  return plaintext
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decryptedKey = await getResendKey()
    if (!decryptedKey) {
      return NextResponse.json([])
    }

    const response = await fetch("https://api.resend.com/topics?limit=100", {
      headers: { Authorization: `Bearer ${decryptedKey}` },
    })

    if (!response.ok) {
      console.error("Failed to fetch topics:", await response.text())
      return NextResponse.json([])
    }

    const data = await response.json()
    return NextResponse.json(data.data || [])
  } catch (error) {
    console.error("Failed to fetch topics:", error)
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, defaultSubscription, visibility } = await request.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const decryptedKey = await getResendKey()
    if (!decryptedKey) {
      return NextResponse.json({ error: "Resend API key not configured" }, { status: 400 })
    }

    const response = await fetch("https://api.resend.com/topics", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${decryptedKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        default_subscription: defaultSubscription || "opt_in",
        visibility: visibility || "private",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to create topic:", errorText)
      return NextResponse.json({ error: "Failed to create topic" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ id: data.id, name: name.trim() })
  } catch (error) {
    console.error("Failed to create topic:", error)
    return NextResponse.json({ error: "Failed to create topic" }, { status: 500 })
  }
}
