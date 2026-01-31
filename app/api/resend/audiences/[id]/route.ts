import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decryptWithMetadata, encrypt } from "@/lib/encryption"

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { service: "resend" },
    })

    if (!apiKey?.key) {
      return NextResponse.json({ error: "Resend API key not configured" }, { status: 400 })
    }

    const { plaintext, needsRotation } = decryptWithMetadata(apiKey.key)
    if (needsRotation) {
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { key: encrypt(plaintext) },
      })
    }

    const response = await fetch(`https://api.resend.com/audiences/${params.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${plaintext}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to delete audience:", errorText)
      return NextResponse.json({ error: "Failed to delete audience" }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete audience:", error)
    return NextResponse.json({ error: "Failed to delete audience" }, { status: 500 })
  }
}
