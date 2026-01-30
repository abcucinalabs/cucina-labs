import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
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

    const newsletter = await prisma.weeklyNewsletter.findUnique({
      where: { id },
    })

    if (!newsletter) {
      return NextResponse.json(
        { error: "Newsletter not found" },
        { status: 404 }
      )
    }

    // Get Resend config
    const resendConfig = await prisma.apiKey.findUnique({
      where: { service: "resend" },
    })

    if (!resendConfig || !resendConfig.key) {
      return NextResponse.json(
        { error: "Resend API key not configured" },
        { status: 400 }
      )
    }

    const { plaintext: apiKey, needsRotation } = decryptWithMetadata(resendConfig.key)
    if (needsRotation) {
      await prisma.apiKey.update({
        where: { id: resendConfig.id },
        data: { key: encrypt(apiKey) },
      })
    }

    const resend = new Resend(apiKey)

    // Get saved recipes
    const recipes = newsletter.recipeIds.length > 0
      ? await prisma.savedContent.findMany({
          where: { id: { in: newsletter.recipeIds } },
        })
      : []

    // Build context and render
    const context = buildWeeklyNewsletterContext(
      {
        weekStart: newsletter.weekStart,
        chefsTableTitle: newsletter.chefsTableTitle,
        chefsTableBody: newsletter.chefsTableBody,
        newsItems: newsletter.newsItems as any[] | null,
        cookingItems: newsletter.cookingItems as any[] | null,
      },
      recipes.map((r) => ({
        title: r.title,
        url: r.url,
        description: r.description,
        source: r.source,
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
    await prisma.weeklyNewsletter.update({
      where: { id },
      data: {
        status: "sent",
        sentAt: new Date(),
      },
    })

    // Mark recipes as used
    if (newsletter.recipeIds.length > 0) {
      await prisma.savedContent.updateMany({
        where: { id: { in: newsletter.recipeIds } },
        data: { used: true, usedInId: id },
      })
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
