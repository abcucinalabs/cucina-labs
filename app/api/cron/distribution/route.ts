import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { runDistribution } from "@/lib/distribution"

export async function GET(request: NextRequest) {
  // Verify cron secret (for Vercel Cron)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get all active sequences
    const sequences = await prisma.sequence.findMany({
      where: { status: "active" },
    })

    const results = []
    for (const sequence of sequences) {
      try {
        // Check if sequence should run now based on schedule
        const shouldRun = checkSchedule(sequence)
        if (shouldRun) {
          await runDistribution(sequence.id)
          results.push({ sequenceId: sequence.id, success: true })
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

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Distribution cron failed:", error)
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

