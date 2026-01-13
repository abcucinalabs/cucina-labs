import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const createSequenceSchema = z.object({
  name: z.string().min(1),
  audienceId: z.string().min(1),
  dayOfWeek: z.array(z.string()),
  time: z.string(),
  timezone: z.string(),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().min(1),
  templateId: z.string().optional(),
  status: z.enum(["draft", "active", "paused"]).default("draft"),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sequences = await prisma.sequence.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(sequences)
  } catch (error) {
    console.error("Failed to fetch sequences:", error)
    return NextResponse.json(
      { error: "Failed to fetch sequences" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = createSequenceSchema.parse(body)

    // Generate cron expression
    const schedule = generateCronExpression(data.dayOfWeek, data.time)

    const sequence = await prisma.sequence.create({
      data: {
        ...data,
        schedule,
      },
    })

    return NextResponse.json(sequence, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to create sequence:", error)
    return NextResponse.json(
      { error: "Failed to create sequence" },
      { status: 500 }
    )
  }
}

function generateCronExpression(daysOfWeek: string[], time: string): string {
  const [hours, minutes] = time.split(":")
  const dayMap: Record<string, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
  }

  if (daysOfWeek.length === 7) {
    // Daily
    return `${minutes} ${hours} * * *`
  } else if (daysOfWeek.length === 0) {
    return `${minutes} ${hours} * * *` // Default to daily
  } else {
    const dayNumbers = daysOfWeek.map((day) => dayMap[day]).join(",")
    return `${minutes} ${hours} * * ${dayNumbers}`
  }
}

