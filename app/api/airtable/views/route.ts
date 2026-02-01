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

    const { apiKey, baseId, tableId } = await request.json()

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

    if (!keyToUse || !baseId || !tableId) {
      return NextResponse.json(
        { error: "API key, base ID, and table ID are required" },
        { status: 400 }
      )
    }

    // Fetch table schema from Airtable API to get views
    const response = await fetch(
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
      {
        headers: {
          Authorization: `Bearer ${keyToUse}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.error?.message || "Failed to fetch views" },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Find the specific table
    const table = data.tables.find((t: any) => t.id === tableId)
    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    // Return views and fields
    const views = (table.views || []).map((view: any) => ({
      id: view.id,
      name: view.name,
      type: view.type,
    }))

    const fields = (table.fields || []).map((field: any) => ({
      id: field.id,
      name: field.name,
      type: field.type,
    }))

    return NextResponse.json({ views, fields })
  } catch (error) {
    console.error("Error fetching Airtable views:", error)
    return NextResponse.json(
      { error: "Failed to fetch Airtable views" },
      { status: 500 }
    )
  }
}
