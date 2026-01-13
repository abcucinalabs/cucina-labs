import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logNewsActivity } from "@/lib/news-activity"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const updateRssSourceSchema = z.object({
  enabled: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = updateRssSourceSchema.parse(body)

    const source = await prisma.rssSource.update({
      where: { id: params.id },
      data,
    })

    await logNewsActivity({
      event: "rss.source.updated",
      status: "info",
      message: `RSS source updated: ${source.name}.`,
      metadata: { id: source.id, enabled: source.enabled },
    })

    return NextResponse.json(source)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to update RSS source:", error)
    await logNewsActivity({
      event: "rss.source.error",
      status: "error",
      message: "Failed to update RSS source.",
      metadata: { error: String(error) },
    })
    return NextResponse.json(
      { error: "Failed to update RSS source" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.rssSource.delete({
      where: { id: params.id },
    })

    await logNewsActivity({
      event: "rss.source.deleted",
      status: "warning",
      message: "RSS source deleted.",
      metadata: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete RSS source:", error)
    await logNewsActivity({
      event: "rss.source.error",
      status: "error",
      message: "Failed to delete RSS source.",
      metadata: { error: String(error) },
    })
    return NextResponse.json(
      { error: "Failed to delete RSS source" },
      { status: 500 }
    )
  }
}
