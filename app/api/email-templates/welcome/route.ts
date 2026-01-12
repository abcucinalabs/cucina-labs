import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const updateTemplateSchema = z.object({
  html: z.string(),
  enabled: z.boolean(),
  subject: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { type: "welcome" },
    })

    if (!template) {
      return NextResponse.json({
        html: "",
        enabled: false,
        subject: "Welcome to cucina labs",
      })
    }

    return NextResponse.json({
      html: template.html,
      enabled: template.enabled,
      subject: template.subject || "Welcome to cucina labs",
    })
  } catch (error) {
    console.error("Failed to fetch template:", error)
    return NextResponse.json(
      { error: "Failed to fetch template" },
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
    const { html, enabled, subject } = updateTemplateSchema.parse(body)

    const template = await prisma.emailTemplate.upsert({
      where: { type: "welcome" },
      update: { html, enabled, subject },
      create: {
        type: "welcome",
        html,
        enabled,
        subject,
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to save template:", error)
    return NextResponse.json(
      { error: "Failed to save template" },
      { status: 500 }
    )
  }
}

