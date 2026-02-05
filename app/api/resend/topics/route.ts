import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getServiceApiKey } from "@/lib/service-keys"

export const dynamic = 'force-dynamic'

let topicsCache: { data: any[]; fetchedAt: number } | null = null
let topicsInFlight: Promise<any[]> | null = null

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

async function fetchTopicsWithRetry(apiKey: string) {
  const now = Date.now()
  if (topicsCache && now - topicsCache.fetchedAt < 30_000) {
    return topicsCache.data
  }
  if (topicsInFlight) {
    return topicsInFlight
  }

  topicsInFlight = (async () => {
    let lastError = "Failed to fetch topics"
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch("https://api.resend.com/topics?limit=100", {
        headers: { Authorization: `Bearer ${apiKey}` },
      })

      if (response.ok) {
        const data = await response.json()
        const topics = data.data || []
        topicsCache = { data: topics, fetchedAt: Date.now() }
        return topics
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
    return await topicsInFlight
  } finally {
    topicsInFlight = null
  }
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

    const topics = await fetchTopicsWithRetry(decryptedKey)
    return NextResponse.json(topics)
  } catch (error) {
    console.error("Failed to fetch topics:", error)
    if (topicsCache?.data) {
      return NextResponse.json(topicsCache.data)
    }
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
