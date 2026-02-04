import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getServiceApiKey } from "@/lib/service-keys"

export const dynamic = 'force-dynamic'

let audiencesCache: { data: Array<{ id: string; name: string }>; fetchedAt: number } | null = null
let audiencesInFlight: Promise<Array<{ id: string; name: string }>> | null = null

async function getResendKey() {
  return getServiceApiKey("resend")
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function getRetryDelayMs(response: Response, attempt: number) {
  const retryAfter = response.headers.get("retry-after")
  if (retryAfter) {
    const parsed = Number(retryAfter)
    if (Number.isFinite(parsed) && parsed > 0) return parsed * 1000
  }
  return 400 * (attempt + 1)
}

async function fetchAudiencesWithRetry(apiKey: string) {
  const now = Date.now()
  if (audiencesCache && now - audiencesCache.fetchedAt < 30_000) {
    return audiencesCache.data
  }
  if (audiencesInFlight) {
    return audiencesInFlight
  }

  audiencesInFlight = (async () => {
    let lastError = "Failed to fetch audiences"
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch("https://api.resend.com/audiences", {
        headers: { Authorization: `Bearer ${apiKey}` },
      })

      if (response.ok) {
        const data = await response.json()
        const audiences =
          data.data?.map((audience: any) => ({
            id: audience.id,
            name: audience.name,
          })) || []
        audiencesCache = { data: audiences, fetchedAt: Date.now() }
        return audiences
      }

      const errorText = await response.text()
      lastError = errorText
      if (response.status === 429 && attempt < 3) {
        await sleep(getRetryDelayMs(response, attempt))
        continue
      }
      break
    }
    throw new Error(lastError)
  })()

  try {
    return await audiencesInFlight
  } finally {
    audiencesInFlight = null
  }
}

function buildAudienceOptions(audiences: Array<{ id: string; name: string }>) {
  const allContactsAudience = audiences.find(
    (audience: { name?: string }) =>
      audience.name?.toLowerCase() === "all contacts"
  )
  const otherAudiences = allContactsAudience
    ? audiences.filter((audience: { id: string }) => audience.id !== allContactsAudience.id)
    : audiences

  return [
    allContactsAudience
      ? { ...allContactsAudience, name: "All Subscribers (Resend)" }
      : { id: "resend_all", name: "All Subscribers (Resend)" },
    ...otherAudiences,
  ]
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

    try {
      const audiences = await fetchAudiencesWithRetry(decryptedKey)

      console.log(`Found ${audiences.length} audiences from Resend`)

      return NextResponse.json(buildAudienceOptions(audiences))
    } catch (error) {
      console.error("Failed to fetch audiences:", error)
      if (audiencesCache?.data?.length) {
        return NextResponse.json(buildAudienceOptions(audiencesCache.data))
      }
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
    const session = await getAuthSession()
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
