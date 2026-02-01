import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import {
  findDataSourceById,
  updateDataSource,
  deleteDataSource,
} from "@/lib/dal"
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
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const dataSource = await findDataSourceById(id)

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
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateDataSourceSchema.parse(body)

    const dataSource = await updateDataSource(id, validatedData)

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
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await deleteDataSource(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete data source:", error)
    return NextResponse.json(
      { error: "Failed to delete data source" },
      { status: 500 }
    )
  }
}
