import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get("url")

    if (!url) {
      return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 })
    }

    // Decode the URL
    const decodedUrl = decodeURIComponent(url)

    // Validate it's a proper URL
    try {
      new URL(decodedUrl)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    // Optional: Log click tracking here
    // You could store clicks in the database for analytics
    // await prisma.clickTracking.create({
    //   data: {
    //     url: decodedUrl,
    //     timestamp: new Date(),
    //   }
    // })

    // Redirect to the external URL
    return NextResponse.redirect(decodedUrl, 302)
  } catch (error) {
    console.error("Redirect error:", error)
    return NextResponse.json({ error: "Failed to redirect" }, { status: 500 })
  }
}
