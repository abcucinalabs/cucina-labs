import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { runDistribution } from "@/lib/distribution"
import { logNewsActivity } from "@/lib/news-activity"

export async function GET(request: NextRequest) {
  // Verify cron secret (for Vercel Cron)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    await logNewsActivity({
      event: "distribution_cron_unauthorized",
      status: "error",
      message: "Unauthorized distribution cron attempt",
    })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await logNewsActivity({
    event: "distribution_cron_triggered",
    status: "info",
    message: "Distribution cron job triggered",
  })

  try {
    // Get all active sequences
    const sequences = await prisma.sequence.findMany({
      where: { status: "active" },
    })

    await logNewsActivity({
      event: "distribution_cron_sequences_found",
      status: "info",
      message: `Found ${sequences.length} active sequence(s)`,
      metadata: { sequenceCount: sequences.length },
    })

    const results = []
    for (const sequence of sequences) {
      try {
        // Check if sequence should run now based on schedule
        const shouldRun = checkSchedule(sequence)
        if (shouldRun) {
          await logNewsActivity({
            event: "distribution_cron_sequence_scheduled",
            status: "info",
            message: `Sequence "${sequence.name}" is scheduled to run now`,
            metadata: { sequenceId: sequence.id, sequenceName: sequence.name },
          })
          await runDistribution(sequence.id)
          results.push({ sequenceId: sequence.id, success: true })
        } else {
          await logNewsActivity({
            event: "distribution_cron_sequence_skipped",
            status: "info",
            message: `Sequence "${sequence.name}" not scheduled for this time`,
            metadata: { sequenceId: sequence.id, sequenceName: sequence.name },
          })
        }
      } catch (error) {
        console.error(`Distribution failed for sequence ${sequence.id}:`, error)
        results.push({
          sequenceId: sequence.id,
          success: false,
          error: String(error),
        })
      }
    }

    await logNewsActivity({
      event: "distribution_cron_completed",
      status: "success",
      message: `Distribution cron completed. Ran ${results.filter(r => r.success).length} sequence(s)`,
      metadata: { totalResults: results.length, successCount: results.filter(r => r.success).length },
    })

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Distribution cron failed:", error)
    await logNewsActivity({
      event: "distribution_cron_failed",
      status: "error",
      message: `Distribution cron job failed: ${error instanceof Error ? error.message : String(error)}`,
      metadata: { error: String(error) },
    })
    return NextResponse.json(
      { error: "Distribution failed", details: String(error) },
      { status: 500 }
    )
  }
}

function checkSchedule(sequence: any): boolean {
  const now = new Date()
  const [hours, minutes] = sequence.time.split(":")
  const currentDay = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()

  // Check if today is in the schedule
  if (!sequence.dayOfWeek.includes(currentDay)) {
    return false
  }

  // Check if current time matches (within 5 minutes)
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const scheduleHour = parseInt(hours)
  const scheduleMinute = parseInt(minutes)

  const timeDiff = Math.abs(
    currentHour * 60 + currentMinute - (scheduleHour * 60 + scheduleMinute)
  )

  return timeDiff <= 5 // Allow 5 minute window
}

