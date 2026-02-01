import { NextRequest, NextResponse } from "next/server"
import { findShortLinkByCode, incrementShortLinkClicks } from "@/lib/dal"

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params

    // Find the short link
    const link = await findShortLinkByCode(code)

    if (!link) {
      // Redirect to homepage if link not found
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Track click asynchronously (don't block redirect)
    incrementShortLinkClicks(link.id)
      .catch((err) => console.error('Click tracking error:', err))

    // Redirect to target URL
    return NextResponse.redirect(link.targetUrl, 302)
  } catch (error) {
    console.error('Redirect error:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}
