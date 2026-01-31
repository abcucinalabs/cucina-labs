import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import {
  defaultSequenceSystemPrompt,
  defaultSequenceUserPrompt,
} from "@/lib/sequence-prompt-defaults"

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existing = await prisma.sequencePromptConfig.findFirst()

    if (existing) {
      const updated = await prisma.sequencePromptConfig.update({
        where: { id: existing.id },
        data: {
          systemPrompt: defaultSequenceSystemPrompt,
          userPrompt: defaultSequenceUserPrompt,
        },
      })
      return NextResponse.json(updated)
    } else {
      const created = await prisma.sequencePromptConfig.create({
        data: {
          systemPrompt: defaultSequenceSystemPrompt,
          userPrompt: defaultSequenceUserPrompt,
        },
      })
      return NextResponse.json(created, { status: 201 })
    }
  } catch (error) {
    console.error("Failed to reset prompt config:", error)
    return NextResponse.json(
      { error: "Failed to reset prompt config" },
      { status: 500 }
    )
  }
}
