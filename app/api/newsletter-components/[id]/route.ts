import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { z } from "zod"

const updateComponentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  type: z.enum(["data", "static", "system"]).optional(),
  dataSourceId: z.string().nullable().optional(),
  displayOptions: z.object({
    maxItems: z.number().optional(),
    layout: z.string().optional(),
    fieldMap: z.record(z.string()).optional(),
  }).nullable().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const component = await prisma.newsletterComponent.findUnique({
      where: { id },
      include: {
        dataSource: true,
      },
    })

    if (!component) {
      return NextResponse.json(
        { error: "Newsletter component not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(component)
  } catch (error) {
    console.error("Failed to fetch newsletter component:", error)
    return NextResponse.json(
      { error: "Failed to fetch newsletter component" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateComponentSchema.parse(body)

    // Transform the data for Prisma - handle null values properly
    const updateData: Prisma.NewsletterComponentUpdateInput = {
      ...validatedData,
      displayOptions: validatedData.displayOptions === null
        ? Prisma.DbNull
        : validatedData.displayOptions,
      dataSource: validatedData.dataSourceId === null
        ? { disconnect: true }
        : validatedData.dataSourceId
          ? { connect: { id: validatedData.dataSourceId } }
          : undefined,
    }
    // Remove dataSourceId from updateData as we're using the relation instead
    delete (updateData as any).dataSourceId

    const component = await prisma.newsletterComponent.update({
      where: { id },
      data: updateData,
      include: {
        dataSource: true,
      },
    })

    return NextResponse.json(component)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to update newsletter component:", error)
    return NextResponse.json(
      { error: "Failed to update newsletter component" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await prisma.newsletterComponent.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete newsletter component:", error)
    return NextResponse.json(
      { error: "Failed to delete newsletter component" },
      { status: 500 }
    )
  }
}
