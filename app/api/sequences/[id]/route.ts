import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { findSequenceById, updateSequence, deleteSequence } from "@/lib/dal"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const updateSequenceSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().optional(),
  audienceId: z.string().min(1).optional(),
  topicId: z.string().optional(),
  dayOfWeek: z.array(z.string()).optional(),
  time: z.string().optional(),
  timezone: z.string().optional(),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().optional(),
  templateId: z.string().optional(),
  promptKey: z.string().optional(),
  contentSources: z.array(z.string()).optional(),
  status: z.enum(["draft", "active", "paused"]).optional(),
  schedule: z.string().optional(),
})

function isMissingSubjectColumnError(error: any) {
  return (
    error?.code === "PGRST204" &&
    typeof error?.message === "string" &&
    error.message.includes("'subject' column")
  )
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = updateSequenceSchema.parse(body)

    // Regenerate cron if schedule changed
    if (data.dayOfWeek || data.time) {
      const existing = await findSequenceById(params.id)
      if (existing) {
        const dayOfWeek = data.dayOfWeek || existing.dayOfWeek
        const time = data.time || existing.time
        const schedule = generateCronExpression(dayOfWeek, time)
        data.schedule = schedule as any
      }
    }

    let sequence: any
    try {
      sequence = await updateSequence(params.id, data)
    } catch (error: any) {
      if (isMissingSubjectColumnError(error) && "subject" in data) {
        const { subject: _subject, ...fallbackData } = data
        sequence = await updateSequence(params.id, fallbackData)
      } else {
        throw error
      }
    }

    return NextResponse.json(sequence)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to update sequence:", error)
    return NextResponse.json(
      { error: "Failed to update sequence" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = updateSequenceSchema.parse(body)

    let sequence: any
    try {
      sequence = await updateSequence(params.id, data)
    } catch (error: any) {
      if (isMissingSubjectColumnError(error) && "subject" in data) {
        const { subject: _subject, ...fallbackData } = data
        sequence = await updateSequence(params.id, fallbackData)
      } else {
        throw error
      }
    }

    return NextResponse.json(sequence)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to update sequence:", error)
    return NextResponse.json(
      { error: "Failed to update sequence" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await deleteSequence(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete sequence:", error)
    return NextResponse.json(
      { error: "Failed to delete sequence" },
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
    return `${minutes} ${hours} * * *`
  } else if (daysOfWeek.length === 0) {
    return `${minutes} ${hours} * * *`
  } else {
    const dayNumbers = daysOfWeek.map((day) => dayMap[day]).join(",")
    return `${minutes} ${hours} * * ${dayNumbers}`
  }
}
