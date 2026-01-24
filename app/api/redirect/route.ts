import { NextRequest, NextResponse } from "next/server"
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit"
import { prisma } from "@/lib/db"
import Parser from "rss-parser"

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
  'bloomberg.com',

  // AI/ML specific
  'openai.com',
  'deepmind.com',
  'anthropic.com',
  'ai.meta.com',
  'blog.google',

  // Add more domains as needed for your newsletter sources
]

const CACHE_TTL_MS = 10 * 60 * 1000
let cachedDomains: Set<string> | null = null
let cachedAt = 0
const rssParser = new Parser()

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, "")
}

function isAllowedDomain(hostname: string, dynamicDomains?: Set<string>): boolean {
  const normalized = normalizeHostname(hostname)
  const staticAllowed = ALLOWED_DOMAINS.some(
    (domain) =>
      normalized === domain || normalized.endsWith(`.${domain}`)
  )
  if (staticAllowed) return true
  if (!dynamicDomains) return false
  if (dynamicDomains.has(normalized)) return true
  for (const domain of dynamicDomains) {
    if (normalized.endsWith(`.${domain}`)) return true
  }
  return false
}

async function getDynamicAllowedDomains(): Promise<Set<string>> {
  const now = Date.now()
  if (cachedDomains && now - cachedAt < CACHE_TTL_MS) {
    return cachedDomains
  }

  const domains = new Set<string>()

  const rssSources = await prisma.rssSource.findMany({
    select: { url: true },
  })

  const rssFeedUrls: string[] = []
  for (const source of rssSources) {
    try {
      const hostname = new URL(source.url).hostname
      domains.add(normalizeHostname(hostname))
      rssFeedUrls.push(source.url)
    } catch {
      // Ignore invalid URLs stored in DB
    }
  }

  // Allow all domains referenced by RSS feed items (keeps allowlist up to date).
  await Promise.allSettled(
    rssFeedUrls.map(async (feedUrl) => {
      try {
        const feed = await rssParser.parseURL(feedUrl)
        for (const item of feed.items || []) {
          const candidate = (item as any).link || (item as any).guid || ""
          if (!candidate) continue
          try {
            const hostname = new URL(candidate).hostname
            domains.add(normalizeHostname(hostname))
          } catch {
            // Ignore invalid item URLs
          }
        }
      } catch {
        // Ignore feed fetch failures; keep existing domains.
      }
    })
  )

  // Include ALL article link domains (covers feeds that point to other domains).
  // Since all articles come from trusted RSS sources, we trust their domains.
  const allArticles = await prisma.article.findMany({
    select: { sourceLink: true, imageLink: true },
    where: { sourceLink: { not: "" } },
  })

  for (const article of allArticles) {
    const candidates = [article.sourceLink, article.imageLink].filter(Boolean) as string[]
    for (const candidate of candidates) {
      try {
        const hostname = new URL(candidate).hostname
        domains.add(normalizeHostname(hostname))
      } catch {
        // Ignore invalid URLs stored in DB
      }
    }
  }

  // Include short link target domains (all short links are for trusted content).
  const shortLinks = await prisma.shortLink.findMany({
    select: { targetUrl: true },
  })

  for (const link of shortLinks) {
    try {
      const hostname = new URL(link.targetUrl).hostname
      domains.add(normalizeHostname(hostname))
    } catch {
      // Ignore invalid URLs
    }
  }

  cachedDomains = domains
  cachedAt = now
  return domains
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
    if (urlObj.protocol !== 'https:') {
      console.warn(`Blocked redirect to non-HTTPS protocol: ${urlObj.protocol}`)
      return NextResponse.json({ error: "Invalid URL protocol" }, { status: 400 })
    }

    const dynamicDomains = await getDynamicAllowedDomains()

    // Security check: Verify domain is in allowlist (static + dynamic)
    if (!isAllowedDomain(urlObj.hostname, dynamicDomains)) {
      console.warn(`Blocked redirect to unauthorized domain: ${urlObj.hostname}`)
      console.warn(`Dynamic domains count: ${dynamicDomains.size}`)
      console.warn(`Attempted URL: ${decodedUrl}`)
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
