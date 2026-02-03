import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getServiceApiKey } from "@/lib/service-keys"

export const dynamic = 'force-dynamic'

async function getResendKey() {
  return getServiceApiKey("resend")
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decryptedKey = await getResendKey()
    if (!decryptedKey) {
      return NextResponse.json({ error: "Resend API key not configured" }, { status: 400 })
    }

    const response = await fetch(`https://api.resend.com/topics/${params.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${decryptedKey}` },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to delete topic:", errorText)
      return NextResponse.json({ error: "Failed to delete topic" }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete topic:", error)
    return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 })
  }
}
