import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { findApiKeyByService, updateApiKey } from "@/lib/dal"
import { decryptWithMetadata, encrypt } from "@/lib/encryption"

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { apiKey } = await request.json()

    let keyToUse = apiKey

    // If using stored key, fetch from database
    if (apiKey === "USE_STORED_KEY") {
      const stored = await findApiKeyByService("airtable")
      if (!stored?.key) {
        return NextResponse.json({ error: "No stored API key found" }, { status: 400 })
      }
      const { plaintext, needsRotation } = decryptWithMetadata(stored.key)
      if (needsRotation) {
        await updateApiKey(stored.id, { key: encrypt(plaintext) })
      }
      keyToUse = plaintext
    }

    if (!keyToUse) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    // Fetch bases from Airtable API
    const response = await fetch("https://api.airtable.com/v0/meta/bases", {
      headers: {
        Authorization: `Bearer ${keyToUse}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.error?.message || "Failed to fetch bases" },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Return simplified base list
    const bases = data.bases.map((base: any) => ({
      id: base.id,
      name: base.name,
    }))

    return NextResponse.json({ bases })
  } catch (error) {
    console.error("Error fetching Airtable bases:", error)
    return NextResponse.json(
      { error: "Failed to fetch Airtable bases" },
      { status: 500 }
    )
  }
}
