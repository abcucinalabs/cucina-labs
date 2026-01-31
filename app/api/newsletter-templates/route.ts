import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

// GET - List all newsletter templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templates = await prisma.newsletterTemplate.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    const usage = await prisma.sequence.groupBy({
      by: ["templateId"],
      _count: { _all: true },
      _max: { lastSent: true },
      where: { templateId: { not: null } }
    })

    const usageMap = new Map(
      usage
        .filter((item) => item.templateId)
        .map((item) => [
          item.templateId as string,
          { count: item._count._all, lastSent: item._max.lastSent }
        ])
    )

    const templatesWithUsage = templates.map((template) => {
      const usageInfo = usageMap.get(template.id)
      return {
        ...template,
        usageCount: usageInfo?.count ?? 0,
        lastUsedAt: usageInfo?.lastSent ?? null,
      }
    })

    return NextResponse.json(templatesWithUsage)
  } catch (error: any) {
    console.error("Failed to fetch templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch templates", details: String(error) },
      { status: 500 }
    )
  }
}

// POST - Create a new newsletter template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      console.error("Template creation failed: No session found")
      return NextResponse.json({ error: "Unauthorized - Please log in again" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, html, isDefault, includeFooter } = body

    console.log("Creating template:", { name, htmlLength: html?.length, isDefault })

    if (!name || !html) {
      console.error("Template creation failed: Missing required fields", { hasName: !!name, hasHtml: !!html })
      return NextResponse.json(
        { error: "Name and HTML are required" },
        { status: 400 }
      )
    }

    // If this template is set as default, unset all other defaults
    if (isDefault) {
      console.log("Unsetting other default templates")
      await prisma.newsletterTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }

    const template = await prisma.newsletterTemplate.create({
      data: {
        name,
        description: description?.trim() || null,
        html,
        isDefault: isDefault || false,
        includeFooter: includeFooter !== undefined ? includeFooter : true,
      }
    })

    console.log("Template created successfully:", { id: template.id, name: template.name })
    return NextResponse.json(template)
  } catch (error: any) {
    console.error("Failed to create template - Detailed error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json(
      { error: "Failed to create template", details: error.message || String(error) },
      { status: 500 }
    )
  }
}
