import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET - Get a single template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const template = await prisma.newsletterTemplate.findUnique({
      where: { id: params.id }
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error: any) {
    console.error("Failed to fetch template:", error)
    return NextResponse.json(
      { error: "Failed to fetch template", details: String(error) },
      { status: 500 }
    )
  }
}

// PUT - Update a template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, html, isDefault } = body

    // If this template is set as default, unset all other defaults
    if (isDefault) {
      await prisma.newsletterTemplate.updateMany({
        where: {
          isDefault: true,
          NOT: { id: params.id }
        },
        data: { isDefault: false }
      })
    }

    const template = await prisma.newsletterTemplate.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(html && { html }),
        ...(isDefault !== undefined && { isDefault })
      }
    })

    return NextResponse.json(template)
  } catch (error: any) {
    console.error("Failed to update template:", error)
    return NextResponse.json(
      { error: "Failed to update template", details: String(error) },
      { status: 500 }
    )
  }
}

// DELETE - Delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.newsletterTemplate.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Failed to delete template:", error)
    return NextResponse.json(
      { error: "Failed to delete template", details: String(error) },
      { status: 500 }
    )
  }
}
