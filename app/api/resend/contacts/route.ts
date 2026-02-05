import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getServiceApiKey } from "@/lib/service-keys"

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

    cursor = data?.next || data?.cursor || data?.pagination?.next || data?.links?.next || null
    hasMore = Boolean(cursor && page.length)
  }

  return contacts
}

async function fetchAllContactsGlobal(apiKey: string): Promise<ResendContact[]> {
  const contacts: ResendContact[] = []
  let cursor: string | null = null
  let hasMore = true

  while (hasMore) {
    const url = new URL("https://api.resend.com/contacts")
    url.searchParams.set("limit", "100")
    if (cursor) url.searchParams.set("cursor", cursor)

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!response.ok) return [] // Not supported or error, return empty to fall back

    const data = await response.json()
    const page = (data?.data || []) as ResendContact[]
    contacts.push(...page)

    cursor = data?.next || data?.cursor || data?.pagination?.next || data?.links?.next || null
    hasMore = Boolean(cursor && page.length)
  }

  return contacts
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resendApiKey = await getServiceApiKey("resend")
    if (!resendApiKey) {
      return NextResponse.json({
        contacts: [],
        audiences: [],
        error: "Resend API key not configured. Go to Settings to add your API key."
      })
    }

    // Fetch all audiences, but do not fail the endpoint if this call fails.
    // Contacts can exist globally without being assigned to an audience.
    let audiences: { id: string; name: string }[] = []
    const audiencesResponse = await fetch("https://api.resend.com/audiences", {
      headers: { Authorization: `Bearer ${resendApiKey}` },
    })
    if (audiencesResponse.ok) {
      const audiencesData = await audiencesResponse.json()
      audiences = (audiencesData.data || []) as { id: string; name: string }[]
    } else {
      const errorText = await audiencesResponse.text()
      console.error("Failed to fetch audiences from Resend:", audiencesResponse.status, errorText)
      return NextResponse.json({
        contacts: [],
        audiences: [],
        error: `Failed to fetch from Resend API: ${audiencesResponse.status}. Check your API key in Settings.`
      })
    }

    // Build a map of all contacts, deduplicating by email
    const contactMap = new Map<string, {
      id: string
      email: string
      firstName: string | null
      lastName: string | null
      unsubscribed: boolean
      createdAt: string
      audiences: string[]
    }>()

    // Try global /contacts endpoint first (returns all contacts)
    const globalContacts = await fetchAllContactsGlobal(resendApiKey)
    for (const contact of globalContacts) {
      if (!contact.email) continue
      contactMap.set(contact.email, {
        id: contact.id,
        email: contact.email,
        firstName: contact.first_name || null,
        lastName: contact.last_name || null,
        unsubscribed: contact.unsubscribed,
        createdAt: contact.created_at,
        audiences: [],
      })
    }

    // Fetch per-audience contacts to get audience membership info
    // (and pick up any contacts not returned by the global endpoint)
    if (audiences.length > 0) {
      for (const audience of audiences) {
        const audienceContacts = await fetchContactsFromAudience(resendApiKey, audience.id)
        for (const contact of audienceContacts) {
          if (!contact.email) continue
          const existing = contactMap.get(contact.email)
          if (existing) {
            existing.audiences.push(audience.name)
            if (!contact.unsubscribed) existing.unsubscribed = false
          } else {
            contactMap.set(contact.email, {
              id: contact.id,
              email: contact.email,
              firstName: contact.first_name || null,
              lastName: contact.last_name || null,
              unsubscribed: contact.unsubscribed,
              createdAt: contact.created_at,
              audiences: [audience.name],
            })
          }
        }
      }
    }

    const enrichedContacts = Array.from(contactMap.values())

    return NextResponse.json({
      contacts: enrichedContacts,
      audiences: audiences.map((a) => ({ id: a.id, name: a.name })),
    })
  } catch (error) {
    console.error("Failed to fetch contacts:", error)
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}
