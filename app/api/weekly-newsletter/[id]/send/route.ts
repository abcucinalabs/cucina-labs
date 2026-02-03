import { NextResponse } from "next/server"
import {
  findWeeklyNewsletterById,
  updateWeeklyNewsletter,
  findApiKeyByService,
  updateApiKey,
  findSavedContent,
  findSavedContentByIds,
  updateSavedContentByIds,
} from "@/lib/dal"
import { Resend } from "resend"
import { decryptWithMetadata, encrypt } from "@/lib/encryption"
import { renderWeeklyNewsletter, buildWeeklyNewsletterContext } from "@/lib/weekly-newsletter-template"

// POST - Send the weekly newsletter
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { testEmail, origin } = body

    const newsletter = await findWeeklyNewsletterById(id)

    if (!newsletter) {
      return NextResponse.json(
        { error: "Newsletter not found" },
        { status: 404 }
      )
    }

    // Get Resend config
    const resendConfig = await findApiKeyByService("resend")

    if (!resendConfig || !resendConfig.key) {
      return NextResponse.json(
        { error: "Resend API key not configured" },
        { status: 400 }
      )
    }

    const { plaintext: apiKey, needsRotation } = decryptWithMetadata(resendConfig.key)
    if (needsRotation) {
      await updateApiKey(resendConfig.id, { key: encrypt(apiKey) })
    }

    const resend = new Resend(apiKey)

    const [autoRecipes, autoCooking, selectedRecipes] = await Promise.all([
      findSavedContent({ type: "reading" }),
      findSavedContent({ type: "cooking" }),
      newsletter.recipeIds.length > 0 ? findSavedContentByIds(newsletter.recipeIds) : Promise.resolve([]),
    ])

    const recipes = selectedRecipes.length > 0 ? selectedRecipes : autoRecipes
    const cooking = Array.isArray(newsletter.cookingItems) && newsletter.cookingItems.length > 0
      ? newsletter.cookingItems
      : autoCooking

    // Build context and render
    const context = buildWeeklyNewsletterContext(
      {
        weekStart: newsletter.weekStart,
        chefsTableTitle: newsletter.chefsTableTitle,
        chefsTableBody: newsletter.chefsTableBody,
        newsItems: newsletter.newsItems as any[] | null,
      },
      recipes.map((r: any) => ({
        title: r.title,
        url: r.url,
        description: r.description,
        source: r.source,
        createdAt: r.createdAt,
      })),
      cooking.map((c: any) => ({
        title: c.title,
        url: c.url,
        description: c.description,
        createdAt: c.createdAt,
      })),
      origin
    )

    const html = renderWeeklyNewsletter(context)

    const weekOf = newsletter.weekStart.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    })
    const subject = `What's Cookin' - Week of ${weekOf}`

    const fromName = resendConfig.resendFromName || "cucina labs"
    const fromEmail = resendConfig.resendFromEmail || "hello@cucina-labs.com"

    if (testEmail) {
      // Send test email to specific address
      const result = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: testEmail,
        subject: `[TEST] ${subject}`,
        html,
      })

      return NextResponse.json({
        success: true,
        type: "test",
        emailId: result.data?.id,
        to: testEmail,
      })
    }

    // Send to audience
    const audienceId = newsletter.audienceId
    if (!audienceId) {
      return NextResponse.json(
        { error: "No audience configured for this newsletter" },
        { status: 400 }
      )
    }

    // Create broadcast
    const broadcastResponse = await resend.broadcasts.create({
      audienceId,
      from: `${fromName} <${fromEmail}>`,
      subject,
      html,
    })

    if (!broadcastResponse.data?.id) {
      return NextResponse.json(
        { error: "Failed to create broadcast" },
        { status: 500 }
      )
    }

    // Send broadcast
    const result = await resend.broadcasts.send(broadcastResponse.data.id)

    // Update newsletter status
    await updateWeeklyNewsletter(id, {
      status: "sent",
      sentAt: new Date(),
    })

    // Mark recipes as used
    if (newsletter.recipeIds.length > 0) {
      await updateSavedContentByIds(newsletter.recipeIds, { used: true, usedInId: id })
    }

    return NextResponse.json({
      success: true,
      type: "broadcast",
      broadcastId: result.data?.id,
      audienceId,
    })
  } catch (error) {
    console.error("Failed to send newsletter:", error)
    return NextResponse.json(
      { error: "Failed to send newsletter", details: String(error) },
      { status: 500 }
    )
  }
}
