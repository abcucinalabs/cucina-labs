import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getPublicVapidKey } from "@/lib/push-notifications"

export async function GET() {
  const session = await getAuthSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const key = getPublicVapidKey()
  if (!key) {
    return NextResponse.json({ error: "VAPID key not configured" }, { status: 503 })
  }

  return NextResponse.json({ key })
}
