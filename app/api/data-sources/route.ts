import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const createDataSourceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["rss_airtable", "airtable"]),
  tableId: z.string().optional(),
  tableName: z.string().optional(),
  viewId: z.string().optional(),
  viewName: z.string().optional(),
  fieldMapping: z.record(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dataSources = await prisma.dataSource.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json(dataSources)
  } catch (error) {
    console.error("Failed to fetch data sources:", error)
    return NextResponse.json(
      { error: "Failed to fetch data sources" },
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
    const validatedData = createDataSourceSchema.parse(body)

    const dataSource = await prisma.dataSource.create({
      data: validatedData,
    })

    return NextResponse.json(dataSource, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to create data source:", error)
    return NextResponse.json(
      { error: "Failed to create data source" },
      { status: 500 }
    )
  }
}
