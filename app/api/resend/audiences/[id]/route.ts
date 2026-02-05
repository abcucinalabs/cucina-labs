import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getServiceApiKey } from "@/lib/service-keys"

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resendApiKey = await getServiceApiKey("resend")
    if (!resendApiKey) {
      return NextResponse.json({ error: "Resend API key not configured" }, { status: 400 })
    }

    const response = await fetch(`https://api.resend.com/audiences/${params.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
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
