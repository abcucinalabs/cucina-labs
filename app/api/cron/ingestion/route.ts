import { NextRequest, NextResponse } from "next/server"
import { runIngestion } from "@/lib/ingestion"
import { logNewsActivity } from "@/lib/news-activity"
import { sendPushNotificationToAll } from "@/lib/push-notifications"

export async function GET(request: NextRequest) {
  // Verify cron secret (for Vercel Cron)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await runIngestion(24) // Default 24 hours
    await logNewsActivity({
      event: "ingestion.cron.success",
      status: "success",
      message: `Cron ingestion completed. Processed ${result.processed}, selected ${result.selected}, stored ${result.stored}.`,
      metadata: { processed: result.processed, selected: result.selected, stored: result.stored },
    })

    await sendPushNotificationToAll({
      title: "Ingestion complete",
      body: `Processed ${result.processed} articles, selected ${result.selected}.`,
      url: "/admin/news",
    })

    return NextResponse.json({
      success: true,
      processed: result.processed,
      selected: result.selected,
      stored: result.stored,
    })
  } catch (error) {
    console.error("Ingestion cron failed:", error)
    await logNewsActivity({
      event: "ingestion.cron.error",
      status: "error",
      message: "Cron ingestion failed.",
      metadata: { error: String(error) },
    })
    return NextResponse.json(
      { error: "Ingestion failed", details: String(error) },
      { status: 500 }
    )
  }
}
