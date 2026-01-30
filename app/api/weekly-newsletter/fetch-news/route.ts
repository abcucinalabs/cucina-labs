import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { decryptWithMetadata, encrypt } from "@/lib/encryption"
import Airtable from "airtable"

// Fetch top news items from Airtable (AI Product Briefing / Daily items)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      baseId: customBaseId,
      tableName: customTableName,
      limit = 3
    } = body

    // Get Airtable config
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { service: "airtable" },
    })

    if (!apiKeyRecord || !apiKeyRecord.key) {
      return NextResponse.json(
        { error: "Airtable API key not configured" },
        { status: 400 }
      )
    }

    const { plaintext: apiKey, needsRotation } = decryptWithMetadata(apiKeyRecord.key)
    if (needsRotation) {
      await prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { key: encrypt(apiKey) },
      })
    }

    // Use provided base/table or default from config
    const baseId = customBaseId || apiKeyRecord.airtableBaseId || process.env.AIRTABLE_BASE_ID
    const tableName = customTableName || "Daily items"

    if (!baseId) {
      return NextResponse.json(
        { error: "Airtable base ID not configured" },
        { status: 400 }
      )
    }

    Airtable.configure({ apiKey })
    const base = Airtable.base(baseId)
    const table = base(tableName)

    // Fetch recent records (last 7 days, sorted by date)
    const records = await new Promise<any[]>((resolve, reject) => {
      const results: any[] = []
      table
        .select({
          maxRecords: limit * 3, // Fetch extra to filter
          sort: [{ field: "Date", direction: "desc" }],
        })
        .eachPage(
          (records, fetchNextPage) => {
            results.push(...records)
            if (results.length >= limit * 3) {
              resolve(results)
            } else {
              fetchNextPage()
            }
          },
          (err) => {
            if (err) reject(err)
            else resolve(results)
          }
        )
    })

    // Map to our format - look for common field names
    const newsItems = records.slice(0, limit).map((record) => {
      const fields = record.fields
      return {
        id: record.id,
        title: fields.Title || fields.title || fields.Name || fields.name || fields.Headline || "",
        url: fields.URL || fields.url || fields.Link || fields.link || fields["Source Link"] || "",
        summary: fields.Summary || fields.summary || fields.Description || fields.description ||
                 fields["AI Summary"] || fields["Why It Matters"] || "",
        source: fields.Source || fields.source || fields.Creator || fields.creator || "",
        date: fields.Date || fields.date || fields["Published Date"] || "",
        category: fields.Category || fields.category || "",
      }
    })

    return NextResponse.json({
      items: newsItems,
      baseId,
      tableName,
      totalFetched: records.length,
    })
  } catch (error) {
    console.error("Failed to fetch news from Airtable:", error)
    return NextResponse.json(
      { error: "Failed to fetch news from Airtable", details: String(error) },
      { status: 500 }
    )
  }
}

// GET - List available Airtable bases and tables
export async function GET() {
  try {
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { service: "airtable" },
    })

    if (!apiKeyRecord || !apiKeyRecord.key) {
      return NextResponse.json(
        { error: "Airtable API key not configured" },
        { status: 400 }
      )
    }

    const { plaintext: apiKey } = decryptWithMetadata(apiKeyRecord.key)

    // Fetch available bases
    const basesResponse = await fetch("https://api.airtable.com/v0/meta/bases", {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!basesResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Airtable bases" },
        { status: 500 }
      )
    }

    const basesData = await basesResponse.json()

    return NextResponse.json({
      bases: basesData.bases || [],
      configuredBaseId: apiKeyRecord.airtableBaseId,
      configuredTableName: apiKeyRecord.airtableTableName,
    })
  } catch (error) {
    console.error("Failed to list Airtable config:", error)
    return NextResponse.json(
      { error: "Failed to list Airtable config" },
      { status: 500 }
    )
  }
}
