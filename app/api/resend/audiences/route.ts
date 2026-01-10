import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/encryption"

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
        console.error("Failed to fetch audiences from Resend:", await response.text())
        // Return a default option if the API fails
        return NextResponse.json([
          { id: "all", name: "All Subscribers (local)" },
        ])
      }

      const data = await response.json()
      
      // Transform the response to match our expected format
      const audiences = data.data?.map((audience: any) => ({
        id: audience.id,
        name: audience.name,
      })) || []

      // Add "All Subscribers" option for local subscribers
      return NextResponse.json([
        { id: "local_all", name: "All Subscribers (local database)" },
        ...audiences,
      ])
    } catch (error) {
      console.error("Failed to fetch audiences:", error)
      return NextResponse.json([
        { id: "local_all", name: "All Subscribers (local database)" },
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
