import { NextResponse } from "next/server"
import {
  findSavedContent,
  createSavedContent,
  updateSavedContent,
  deleteSavedContent,
} from "@/lib/dal"

// GET - List all saved content
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // "recipe" or "cooking"
    const used = searchParams.get("used") // "true" or "false"

    const filters: any = {}
    if (type) filters.type = type
    if (used !== null) filters.used = used === "true"

    const content = await findSavedContent(filters)

    return NextResponse.json(content)
  } catch (error) {
    console.error("Failed to fetch saved content:", error)
    return NextResponse.json(
      { error: "Failed to fetch saved content" },
      { status: 500 }
    )
  }
}

// POST - Save new content (mobile-friendly)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, title, url, description, imageUrl, source, notes } = body

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    if (!type || !["recipe", "cooking"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'recipe' or 'cooking'" },
        { status: 400 }
      )
    }

    const savedContent = await createSavedContent({
      type,
      title,
      url: url || null,
      description: description || null,
      imageUrl: imageUrl || null,
      source: source || null,
      notes: notes || null,
    })

    return NextResponse.json(savedContent, { status: 201 })
  } catch (error) {
    console.error("Failed to save content:", error)
    return NextResponse.json(
      { error: "Failed to save content" },
      { status: 500 }
    )
  }
}

// PATCH - Update saved content
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      )
    }

    const savedContent = await updateSavedContent(id, updates)

    return NextResponse.json(savedContent)
  } catch (error) {
    console.error("Failed to update saved content:", error)
    return NextResponse.json(
      { error: "Failed to update saved content" },
      { status: 500 }
    )
  }
}

// DELETE - Delete saved content
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      )
    }

    await deleteSavedContent(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete saved content:", error)
    return NextResponse.json(
      { error: "Failed to delete saved content" },
      { status: 500 }
    )
  }
}
