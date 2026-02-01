import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
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
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKey = await findApiKeyByService("resend")

    if (!apiKey || !apiKey.key) {
      return NextResponse.json([])
    }

    const { plaintext, needsRotation } = decryptWithMetadata(apiKey.key)
    if (needsRotation) {
      await updateApiKey(apiKey.id, { key: encrypt(plaintext) })
    }
    const decryptedKey = plaintext

    // Fetch audiences from Resend API
    try {
      const response = await fetch("https://api.resend.com/audiences", {
        headers: {
          Authorization: `Bearer ${decryptedKey}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Failed to fetch audiences from Resend:", errorText)
        console.error("Response status:", response.status)
        // Return a default option if the API fails
        return NextResponse.json([
          { id: "resend_all", name: "All Subscribers (Resend)" },
        ])
      }

      const data = await response.json()
      console.log("Resend API response:", JSON.stringify(data, null, 2))

      // Transform the response to match our expected format
      const audiences = data.data?.map((audience: any) => ({
        id: audience.id,
        name: audience.name,
      })) || []

      console.log(`Found ${audiences.length} audiences from Resend`)

      const allContactsAudience = audiences.find(
        (audience: { name?: string }) =>
          audience.name?.toLowerCase() === "all contacts"
      )
      const otherAudiences = allContactsAudience
        ? audiences.filter((audience: { id: string }) => audience.id !== allContactsAudience.id)
        : audiences

      // Add "All Subscribers" option for Resend contacts (prefer actual All Contacts audience)
      return NextResponse.json([
        allContactsAudience
          ? { ...allContactsAudience, name: "All Subscribers (Resend)" }
          : { id: "resend_all", name: "All Subscribers (Resend)" },
        ...otherAudiences,
      ])
    } catch (error) {
      console.error("Failed to fetch audiences:", error)
      return NextResponse.json([
        { id: "resend_all", name: "All Subscribers (Resend)" },
      ])
    }
  } catch (error) {
    console.error("Failed to fetch audiences:", error)
    return NextResponse.json(
      { error: "Failed to fetch audiences" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await request.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const decryptedKey = await getResendKey()
    if (!decryptedKey) {
      return NextResponse.json({ error: "Resend API key not configured" }, { status: 400 })
    }

    const response = await fetch("https://api.resend.com/audiences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${decryptedKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: name.trim() }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to create audience:", errorText)
      return NextResponse.json({ error: "Failed to create audience" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ id: data.id, name: data.name })
  } catch (error) {
    console.error("Failed to create audience:", error)
    return NextResponse.json({ error: "Failed to create audience" }, { status: 500 })
  }
}
