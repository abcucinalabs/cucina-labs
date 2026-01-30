import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const updateTemplateSchema = z.object({
  enabled: z.boolean(),
  subject: z.string().optional(),
  html: z.string().optional(),
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
        enabled: false,
        subject: "Welcome to cucina labs",
        html: "",
      })
    }

    return NextResponse.json({
      enabled: template.enabled,
      subject: template.subject || "Welcome to cucina labs",
      html: template.html || "",
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
    const { enabled, subject, html } = updateTemplateSchema.parse(body)

    const template = await prisma.emailTemplate.upsert({
      where: { type: "welcome" },
      update: {
        enabled,
        subject,
        html: html || "",
      },
      create: {
        type: "welcome",
        enabled,
        subject,
        html: html || "",
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
      { error: "Failed to save template", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
