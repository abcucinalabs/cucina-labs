import { createNewsActivity } from "@/lib/dal"

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
    await createNewsActivity({
      event,
      status,
      message,
      metadata: metadata ? metadata : undefined,
    })
  } catch (error) {
    console.error("Failed to write news activity log:", error)
  }
}
