import { withAuth } from "next-auth/middleware"
import { NextRequest, NextResponse } from "next/server"

const authMiddleware = withAuth({
  pages: {
    signIn: "/login",
  },
})

const READONLY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])
const READONLY_API_PREFIXES = [
  "/api/users",
  "/api/integrations",
  "/api/airtable",
  "/api/rss-sources",
  "/api/ingestion",
  "/api/sequences",
  "/api/newsletter-templates",
  "/api/email-templates",
  "/api/admin",
]

const isMobileUserAgent = (userAgent: string | null) => {
  if (!userAgent) return false
  return /iphone|ipad|ipod|android|mobile/i.test(userAgent)
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (
    READONLY_METHODS.has(request.method) &&
    READONLY_API_PREFIXES.some((prefix) => pathname.startsWith(prefix)) &&
    isMobileUserAgent(request.headers.get("user-agent"))
  ) {
    return NextResponse.json(
      {
        error: "Read-only mode is enabled on mobile. Use a desktop browser to make changes.",
        code: "read_only_mobile",
      },
      { status: 403 }
    )
  }

  if (pathname.startsWith("/admin")) {
    return authMiddleware(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
}
