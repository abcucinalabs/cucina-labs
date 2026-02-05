import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

const READONLY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])
const READONLY_API_PREFIXES = [
  "/api/users",
  "/api/integrations",
  "/api/rss-sources",
  "/api/ingestion",
  "/api/newsletter-templates",
  "/api/email-templates",
  "/api/admin",
]

const isMobileUserAgent = (userAgent: string | null) => {
  if (!userAgent) return false
  return /iphone|ipad|ipod|android|mobile/i.test(userAgent)
}

export default async function middleware(request: NextRequest) {
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

  // Refresh auth cookies for admin pages, /save, and API routes
  const needsAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/save") ||
    pathname.startsWith("/api/")

  if (needsAuth) {
    let response = NextResponse.next({
      request: { headers: request.headers },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({ name, value, ...options })
            response = NextResponse.next({
              request: { headers: request.headers },
            })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            request.cookies.set({ name, value: "", ...options })
            response = NextResponse.next({
              request: { headers: request.headers },
            })
            response.cookies.set({ name, value: "", ...options })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Only redirect to login for page routes, not API routes
    if (!user && !pathname.startsWith("/api/")) {
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*", "/save"],
}
