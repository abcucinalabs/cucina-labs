import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { z } from "zod"

const updateDataSourceSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["rss_airtable", "airtable"]).optional(),
  tableId: z.string().nullable().optional(),
  tableName: z.string().nullable().optional(),
  viewId: z.string().nullable().optional(),
  viewName: z.string().nullable().optional(),
  fieldMapping: z.record(z.string()).nullable().optional(),
  syncStatus: z.enum(["idle", "syncing", "success", "error"]).optional(),
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

    const dataSource = await prisma.dataSource.findUnique({
      where: { id },
    })

    if (!dataSource) {
      return NextResponse.json(
        { error: "Data source not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(dataSource)
  } catch (error) {
    console.error("Failed to fetch data source:", error)
    return NextResponse.json(
      { error: "Failed to fetch data source" },
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
    const validatedData = updateDataSourceSchema.parse(body)

    // Transform the data for Prisma - handle null JSON values properly
    const updateData: Prisma.DataSourceUpdateInput = {
      ...validatedData,
      fieldMapping: validatedData.fieldMapping === null
        ? Prisma.DbNull
        : validatedData.fieldMapping,
    }

    const dataSource = await prisma.dataSource.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(dataSource)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to update data source:", error)
    return NextResponse.json(
      { error: "Failed to update data source" },
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

    await prisma.dataSource.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete data source:", error)
    return NextResponse.json(
      { error: "Failed to delete data source" },
      { status: 500 }
    )
  }
}
