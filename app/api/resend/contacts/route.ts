import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decryptWithMetadata, encrypt } from "@/lib/encryption"

export const dynamic = 'force-dynamic'

type ResendContact = {
  id: string
  email: string
  first_name?: string
  last_name?: string
  unsubscribed: boolean
  created_at: string
}

async function fetchContactsFromAudience(apiKey: string, audienceId: string): Promise<ResendContact[]> {
  const contacts: ResendContact[] = []
  let cursor: string | null = null
  let hasMore = true

  while (hasMore) {
    const url = new URL(`https://api.resend.com/audiences/${audienceId}/contacts`)
    url.searchParams.set("limit", "100")
    if (cursor) url.searchParams.set("cursor", cursor)

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!response.ok) break

    const data = await response.json()
    const page = (data?.data || []) as ResendContact[]
    contacts.push(...page)

    cursor = data?.next || data?.cursor || null
    hasMore = Boolean(cursor && page.length)
  }

  return contacts
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { service: "resend" },
    })

    if (!apiKey?.key) {
      return NextResponse.json({ contacts: [], audiences: [] })
    }

    const { plaintext, needsRotation } = decryptWithMetadata(apiKey.key)
    if (needsRotation) {
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { key: encrypt(plaintext) },
      })
    }

    // Fetch all audiences
    const audiencesResponse = await fetch("https://api.resend.com/audiences", {
      headers: { Authorization: `Bearer ${plaintext}` },
    })

    if (!audiencesResponse.ok) {
      return NextResponse.json({ contacts: [], audiences: [] })
    }

    const audiencesData = await audiencesResponse.json()
    const audiences = (audiencesData.data || []) as { id: string; name: string }[]

    // Find "All Contacts" audience or use the first one
    const allContactsAudience = audiences.find(
      (a) => a.name?.toLowerCase() === "all contacts"
    )
    const primaryAudienceId = allContactsAudience?.id || audiences[0]?.id

    if (!primaryAudienceId) {
      return NextResponse.json({ contacts: [], audiences })
    }

    // Fetch contacts from primary audience
    const contacts = await fetchContactsFromAudience(plaintext, primaryAudienceId)

    // Build audience membership map by checking other audiences
    const contactAudienceMap: Record<string, string[]> = {}

    for (const audience of audiences) {
      if (audience.id === primaryAudienceId) continue
      const audienceContacts = await fetchContactsFromAudience(plaintext, audience.id)
      for (const contact of audienceContacts) {
        if (!contact.email) continue
        if (!contactAudienceMap[contact.email]) {
          contactAudienceMap[contact.email] = []
        }
        contactAudienceMap[contact.email].push(audience.name)
      }
    }

    const enrichedContacts = contacts.map((contact) => ({
      id: contact.id,
      email: contact.email,
      firstName: contact.first_name || null,
      lastName: contact.last_name || null,
      unsubscribed: contact.unsubscribed,
      createdAt: contact.created_at,
      audiences: contactAudienceMap[contact.email] || [],
    }))

    return NextResponse.json({
      contacts: enrichedContacts,
      audiences: audiences.map((a) => ({ id: a.id, name: a.name })),
    })
  } catch (error) {
    console.error("Failed to fetch contacts:", error)
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}
