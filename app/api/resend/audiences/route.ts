import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/encryption"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { service: "resend" },
    })

    if (!apiKey || !apiKey.key) {
      return NextResponse.json([])
    }

    const decryptedKey = decrypt(apiKey.key)

    // Fetch audiences from Resend API
    try {
      const response = await fetch("https://api.resend.com/audiences", {
        headers: {
          Authorization: `Bearer ${decryptedKey}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Failed to fetch audiences from Resend:", errorText)
        console.error("Response status:", response.status)
        // Return a default option if the API fails
        return NextResponse.json([
          { id: "resend_all", name: "All Subscribers (Resend)" },
        ])
      }

      const data = await response.json()
      console.log("Resend API response:", JSON.stringify(data, null, 2))

      // Transform the response to match our expected format
      const audiences = data.data?.map((audience: any) => ({
        id: audience.id,
        name: audience.name,
      })) || []

      console.log(`Found ${audiences.length} audiences from Resend`)

      const allContactsAudience = audiences.find(
        (audience: { name?: string }) =>
          audience.name?.toLowerCase() === "all contacts"
      )
      const otherAudiences = allContactsAudience
        ? audiences.filter((audience: { id: string }) => audience.id !== allContactsAudience.id)
        : audiences

      // Add "All Subscribers" option for Resend contacts (prefer actual All Contacts audience)
      return NextResponse.json([
        allContactsAudience
          ? { ...allContactsAudience, name: "All Subscribers (Resend)" }
          : { id: "resend_all", name: "All Subscribers (Resend)" },
        ...otherAudiences,
      ])
    } catch (error) {
      console.error("Failed to fetch audiences:", error)
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
