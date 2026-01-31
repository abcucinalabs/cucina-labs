import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import {
  defaultSequenceSystemPrompt,
  defaultSequenceUserPrompt,
} from "@/lib/sequence-prompt-defaults"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const config = await prisma.sequencePromptConfig.findFirst()

    return NextResponse.json({
      systemPrompt: config?.systemPrompt || defaultSequenceSystemPrompt,
      userPrompt: config?.userPrompt || defaultSequenceUserPrompt,
      isDefault: !config,
    })
  } catch (error) {
    console.error("Failed to fetch prompt config:", error)
    return NextResponse.json(
      { error: "Failed to fetch prompt config" },
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
    const { systemPrompt, userPrompt } = body

    if (!systemPrompt && !userPrompt) {
      return NextResponse.json(
        { error: "At least one prompt field is required" },
        { status: 400 }
      )
    }

    const existing = await prisma.sequencePromptConfig.findFirst()

    if (existing) {
      const updated = await prisma.sequencePromptConfig.update({
        where: { id: existing.id },
        data: {
          ...(systemPrompt !== undefined && { systemPrompt }),
          ...(userPrompt !== undefined && { userPrompt }),
        },
      })
      return NextResponse.json(updated)
    } else {
      const created = await prisma.sequencePromptConfig.create({
        data: {
          systemPrompt: systemPrompt || defaultSequenceSystemPrompt,
          userPrompt: userPrompt || defaultSequenceUserPrompt,
        },
      })
      return NextResponse.json(created, { status: 201 })
    }
  } catch (error) {
    console.error("Failed to update prompt config:", error)
    return NextResponse.json(
      { error: "Failed to update prompt config" },
      { status: 500 }
    )
  }
}
