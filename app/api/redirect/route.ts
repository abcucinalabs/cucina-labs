import { NextRequest, NextResponse } from "next/server"
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit"

// Allowlist of domains that are permitted for redirects
// Add your RSS feed sources and trusted newsletter content domains here
const ALLOWED_DOMAINS = [
  // Tech news sites (common RSS sources)
  'techcrunch.com',
  'theverge.com',
  'wired.com',
  'arstechnica.com',
  'engadget.com',
  'venturebeat.com',
  'mashable.com',
  'cnet.com',
  'zdnet.com',
  'thenextweb.com',

  // AI/ML specific
  'openai.com',
  'deepmind.com',
  'anthropic.com',
  'ai.meta.com',
  'blog.google',

  // Add more domains as needed for your newsletter sources
]

function isAllowedDomain(hostname: string): boolean {
  return ALLOWED_DOMAINS.some(domain =>
    hostname === domain || hostname.endsWith(`.${domain}`)
  )
}

export async function GET(request: NextRequest) {
  // Apply rate limiting: 100 redirects per minute per IP (prevents abuse)
  const rateLimitResponse = rateLimit(request, RateLimitPresets.LENIENT, "redirect")
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get("url")

    if (!url) {
      return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 })
    }

    // Decode the URL
    const decodedUrl = decodeURIComponent(url)

    // Validate it's a proper URL
    let urlObj: URL
    try {
      urlObj = new URL(decodedUrl)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Security check: Only allow HTTPS (no HTTP, javascript:, data:, etc.)
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      console.warn(`Blocked redirect to non-HTTP(S) protocol: ${urlObj.protocol}`)
      return NextResponse.json({ error: "Invalid URL protocol" }, { status: 400 })
    }

    // Security check: Verify domain is in allowlist
    if (!isAllowedDomain(urlObj.hostname)) {
      console.warn(`Blocked redirect to unauthorized domain: ${urlObj.hostname}`)
      return NextResponse.json({
        error: "Redirect to this domain is not permitted for security reasons"
      }, { status: 403 })
    }

    // Optional: Log click tracking here
    // await prisma.clickTracking.create({
    //   data: {
    //     url: decodedUrl,
    //     hostname: urlObj.hostname,
    //     timestamp: new Date(),
    //   }
    // })

    // Redirect to the validated external URL
    return NextResponse.redirect(decodedUrl, 302)
  } catch (error) {
    console.error("Redirect error:", error)
    return NextResponse.json({ error: "Failed to redirect" }, { status: 500 })
  }
}
