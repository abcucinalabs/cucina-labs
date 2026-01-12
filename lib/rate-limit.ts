import { NextRequest, NextResponse } from "next/server"

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max requests allowed per interval
}

interface RateLimitStore {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// NOTE: This resets on server restart. For production at scale, use Redis or similar.
const rateLimitStore = new Map<string, RateLimitStore>()

// Clean up old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Get client identifier from request (IP address or fallback)
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers (handles proxies/load balancers)
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfConnectingIp = request.headers.get("cf-connecting-ip") // Cloudflare

  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first one
    return forwardedFor.split(",")[0].trim()
  }

  if (realIp) {
    return realIp
  }

  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Fallback to a generic identifier (not ideal but better than nothing)
  return "unknown"
}

/**
 * Rate limiter middleware
 * Returns null if request is allowed, or NextResponse with 429 status if rate limited
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  namespace: string = "default"
): NextResponse | null {
  const identifier = getClientIdentifier(request)
  const key = `${namespace}:${identifier}`
  const now = Date.now()

  const store = rateLimitStore.get(key)

  if (!store || now > store.resetTime) {
    // First request in window or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.interval,
    })
    return null // Allow request
  }

  if (store.count >= config.uniqueTokenPerInterval) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((store.resetTime - now) / 1000)

    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.uniqueTokenPerInterval),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.floor(store.resetTime / 1000)),
        },
      }
    )
  }

  // Increment count and allow request
  store.count += 1
  return null
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  // Strict: For sensitive endpoints like signup (5 requests per 15 minutes)
  STRICT: {
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 5,
  },

  // Moderate: For auth endpoints like login (10 requests per 15 minutes)
  MODERATE: {
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 10,
  },

  // Standard: For general API endpoints (30 requests per minute)
  STANDARD: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 30,
  },

  // Lenient: For read-heavy endpoints (100 requests per minute)
  LENIENT: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 100,
  },
}
