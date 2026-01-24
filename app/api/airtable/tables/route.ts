import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decryptWithMetadata, encrypt } from "@/lib/encryption"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { apiKey, baseId } = await request.json()

    let keyToUse = apiKey
    
    // If using stored key, fetch from database
    if (apiKey === "USE_STORED_KEY") {
      const stored = await prisma.apiKey.findUnique({ where: { service: "airtable" } })
      if (!stored?.key) {
        return NextResponse.json({ error: "No stored API key found" }, { status: 400 })
      }
      const { plaintext, needsRotation } = decryptWithMetadata(stored.key)
      if (needsRotation) {
        await prisma.apiKey.update({
          where: { id: stored.id },
          data: { key: encrypt(plaintext) },
        })
      }
      keyToUse = plaintext
    }

    if (!keyToUse || !baseId) {
      return NextResponse.json(
        { error: "API key and base ID are required" },
        { status: 400 }
      )
    }

    // Fetch tables from Airtable API
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
        { error: error.error?.message || "Failed to fetch tables" },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Return simplified table list
    const tables = data.tables.map((table: any) => ({
      id: table.id,
      name: table.name,
    }))

    return NextResponse.json({ tables })
  } catch (error) {
    console.error("Error fetching Airtable tables:", error)
    return NextResponse.json(
      { error: "Failed to fetch Airtable tables" },
      { status: 500 }
    )
  }
}
