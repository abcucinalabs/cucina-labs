import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import {
  findAllNewsletterComponents,
  createNewsletterComponent,
} from "@/lib/dal"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const createComponentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["data", "static", "system"]),
  dataSourceId: z.string().optional(),
  displayOptions: z.object({
    maxItems: z.number().optional(),
    layout: z.string().optional(),
    fieldMap: z.record(z.string()).optional(),
  }).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const components = await findAllNewsletterComponents()

    return NextResponse.json(components)
  } catch (error) {
    console.error("Failed to fetch newsletter components:", error)
    return NextResponse.json(
      { error: "Failed to fetch newsletter components" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createComponentSchema.parse(body)

    const component = await createNewsletterComponent({
      name: validatedData.name,
      description: validatedData.description,
      type: validatedData.type,
      dataSourceId: validatedData.dataSourceId,
      displayOptions: validatedData.displayOptions,
    })

    return NextResponse.json(component, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to create newsletter component:", error)
    return NextResponse.json(
      { error: "Failed to create newsletter component" },
      { status: 500 }
    )
  }
}
