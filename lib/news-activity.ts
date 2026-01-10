import { prisma } from "@/lib/db"

type NewsActivityStatus = "info" | "success" | "warning" | "error"

interface LogNewsActivityInput {
  event: string
  status?: NewsActivityStatus
  message: string
  metadata?: Record<string, unknown>
}

export async function logNewsActivity({
  event,
  status = "info",
  message,
  metadata,
}: LogNewsActivityInput): Promise<void> {
  try {
    const activityModel = (prisma as any).newsActivity
    if (!activityModel) {
      console.error("NewsActivity model not available; restart the server.")
      return
    }

    await activityModel.create({
      data: {
        event,
        status,
        message,
        metadata: metadata ? metadata : undefined,
      },
    })
  } catch (error) {
    console.error("Failed to write news activity log:", error)
  }
}
