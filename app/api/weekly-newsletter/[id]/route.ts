export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import {
  findWeeklyNewsletterById,
  updateWeeklyNewsletter,
  deleteWeeklyNewsletter,
  findSavedContentByIds,
  updateSavedContentByIds,
  resetSavedContentByUsedInId,
} from "@/lib/dal"

// GET - Get single weekly newsletter with recipes
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const newsletter = await findWeeklyNewsletterById(id)

    if (!newsletter) {
      return NextResponse.json(
        { error: "Newsletter not found" },
        { status: 404 }
      )
    }

    // Fetch associated saved content (recipes)
    const recipes = newsletter.recipeIds.length > 0
      ? await findSavedContentByIds(newsletter.recipeIds)
      : []

    return NextResponse.json({ ...newsletter, recipes })
  } catch (error) {
    console.error("Failed to fetch weekly newsletter:", error)
    return NextResponse.json(
      { error: "Failed to fetch weekly newsletter" },
      { status: 500 }
    )
  }
}

// PATCH - Update weekly newsletter
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      chefsTableTitle,
      chefsTableBody,
      newsItems,
      recipeIds,
      cookingItems,
      systemPrompt,
      status,
      audienceId,
    } = body

    const updateData: any = {}

    if (chefsTableTitle !== undefined) updateData.chefsTableTitle = chefsTableTitle
    if (chefsTableBody !== undefined) updateData.chefsTableBody = chefsTableBody
    if (newsItems !== undefined) updateData.newsItems = newsItems
    if (recipeIds !== undefined) updateData.recipeIds = recipeIds
    if (cookingItems !== undefined) updateData.cookingItems = cookingItems
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt
    if (status !== undefined) updateData.status = status
    if (audienceId !== undefined) updateData.audienceId = audienceId

    const newsletter = await updateWeeklyNewsletter(id, updateData)

    // If recipeIds were updated, mark those as used
    if (recipeIds && recipeIds.length > 0) {
      await updateSavedContentByIds(recipeIds, { used: true, usedInId: id })
    }

    return NextResponse.json(newsletter)
  } catch (error) {
    console.error("Failed to update weekly newsletter:", error)
    return NextResponse.json(
      { error: "Failed to update weekly newsletter" },
      { status: 500 }
    )
  }
}

// DELETE - Delete weekly newsletter
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Unmark recipes as used
    await resetSavedContentByUsedInId(id)

    await deleteWeeklyNewsletter(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete weekly newsletter:", error)
    return NextResponse.json(
      { error: "Failed to delete weekly newsletter" },
      { status: 500 }
    )
  }
}
