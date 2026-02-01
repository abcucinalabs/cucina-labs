import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { findAllNewsletterTemplates, createNewsletterTemplate, clearDefaultNewsletterTemplates, getSequenceCountsByTemplateId } from "@/lib/dal"

export const dynamic = 'force-dynamic'

// GET - List all newsletter templates
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templates = await findAllNewsletterTemplates()

    const usageCounts = await getSequenceCountsByTemplateId()

    const templatesWithUsage = templates.map((template: any) => {
      return {
        ...template,
        usageCount: usageCounts[template.id] ?? 0,
        lastUsedAt: null,
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
    const session = await getAuthSession()
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
      await clearDefaultNewsletterTemplates()
    }

    const template = await createNewsletterTemplate({
      name,
      description: description?.trim() || null,
      html,
      isDefault: isDefault || false,
      includeFooter: includeFooter !== undefined ? includeFooter : true,
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
