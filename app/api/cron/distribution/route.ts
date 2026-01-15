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
        const scheduleCheck = checkSchedule(sequence)
        await logNewsActivity({
          event: "distribution_cron_schedule_check",
          status: "info",
          message: `Schedule check for "${sequence.name}"`,
          metadata: {
            sequenceId: sequence.id,
            sequenceName: sequence.name,
            schedule: sequence.time,
            timezone: sequence.timezone || "UTC",
            dayOfWeek: sequence.dayOfWeek,
            localTime: scheduleCheck.localTime,
            shouldRun: scheduleCheck.shouldRun,
          },
        })
        if (scheduleCheck.shouldRun) {
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

function checkSchedule(sequence: any): { shouldRun: boolean; localTime: string } {
  const now = new Date()
  const timeZone = sequence.timezone || "UTC"
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "long",
    hour12: false,
  })
  const parts = formatter.formatToParts(now)
  const hourPart = parts.find((part) => part.type === "hour")?.value
  const minutePart = parts.find((part) => part.type === "minute")?.value
  const weekdayPart = parts.find((part) => part.type === "weekday")?.value
  if (!hourPart || !minutePart || !weekdayPart) {
    return { shouldRun: false, localTime: "invalid" }
  }

  const [hours, minutes] = sequence.time.split(":")
  const currentDay = weekdayPart.toLowerCase()
  const localTime = `${currentDay} ${hourPart}:${minutePart} ${timeZone}`

  // Check if today is in the schedule
  if (!sequence.dayOfWeek.includes(currentDay)) {
    return { shouldRun: false, localTime }
  }

  // Check if current time matches (within 5 minutes)
  const currentHour = parseInt(hourPart, 10)
  const currentMinute = parseInt(minutePart, 10)
  const scheduleHour = parseInt(hours)
  const scheduleMinute = parseInt(minutes)

  const timeDiff = Math.abs(
    currentHour * 60 + currentMinute - (scheduleHour * 60 + scheduleMinute)
  )

  return { shouldRun: timeDiff <= 5, localTime } // Allow 5 minute window
}
