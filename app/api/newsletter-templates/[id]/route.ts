import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { findNewsletterTemplateById, updateNewsletterTemplate, deleteNewsletterTemplate, clearDefaultNewsletterTemplates, countSequencesByTemplateId } from "@/lib/dal"

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const template = await findNewsletterTemplateById(params.id)

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error("Failed to fetch template:", error)
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    )
  }
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
    const { name, description, html, isDefault, includeFooter } = body

    if (!name || !html) {
      return NextResponse.json(
        { error: "Name and HTML are required" },
        { status: 400 }
      )
    }

    if (isDefault === true) {
      await clearDefaultNewsletterTemplates(params.id)
    }

    const data: {
      name: string
      description?: string | null
      html: string
      isDefault?: boolean
      includeFooter?: boolean
    } = {
      name,
      html,
      description: description?.trim() || null
    }

    if (typeof isDefault === "boolean") {
      data.isDefault = isDefault
    }

    if (typeof includeFooter === "boolean") {
      data.includeFooter = includeFooter
    }

    const template = await updateNewsletterTemplate(params.id, data)

    return NextResponse.json(template)
  } catch (error) {
    console.error("Failed to update template:", error)
    return NextResponse.json(
      { error: "Failed to update template" },
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

    const template = await findNewsletterTemplateById(params.id)

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    if (template.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default template" },
        { status: 400 }
      )
    }

    const usageCount = await countSequencesByTemplateId(params.id)

    if (usageCount > 0) {
      return NextResponse.json(
        {
          error: "Template in use by sequences",
          details: `This template is used by ${usageCount} sequence(s).`,
          usageCount,
        },
        { status: 400 }
      )
    }

    await deleteNewsletterTemplate(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete template:", error)
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    )
  }
}
