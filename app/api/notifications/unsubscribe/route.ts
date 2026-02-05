export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { deletePushSubscription } from "@/lib/push-notifications"

export async function POST(request: NextRequest) {
  const session = await getAuthSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.endpoint) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  await deletePushSubscription(body.endpoint)
  return NextResponse.json({ success: true })
}
