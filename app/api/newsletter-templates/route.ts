import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

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

    return NextResponse.json(templates)
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
    const { name, html, isDefault } = body

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
        html,
        isDefault: isDefault || false
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
