import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateNewsletterContent, generateEmailHtml, generatePlainText, getAllArticlesFromAirtable, getRecentArticles } from "@/lib/distribution"
import { buildNewsletterTemplateContext, renderNewsletterTemplate } from "@/lib/newsletter-template"
import { decrypt } from "@/lib/encryption"
import { prisma } from "@/lib/db"
import { Resend } from "resend"
import { z } from "zod"

const testSchema = z.object({
  testEmail: z.string().email(),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().optional(),
  customHtml: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { testEmail, systemPrompt, userPrompt, customHtml } = testSchema.parse(body)

    // Check Airtable config
    const airtableConfig = await prisma.apiKey.findUnique({
      where: { service: "airtable" },
    })

    let articles: any[] = []

    // Try Airtable first
    if (airtableConfig?.key && airtableConfig?.airtableBaseId && airtableConfig?.airtableTableId) {
      try {
        articles = await getAllArticlesFromAirtable(20)
      } catch (error) {
        console.error("Failed to fetch from Airtable:", error)
      }
    }

    // Fallback to local database
    if (articles.length === 0) {
      articles = await getRecentArticles()
    }

    if (articles.length === 0) {
      return NextResponse.json(
        { error: "No articles available. Please configure Airtable or run ingestion first." },
        { status: 400 }
      )
    }

    // Generate newsletter content
    const content = await generateNewsletterContent(
      articles,
      systemPrompt || "",
      userPrompt || ""
    )

    const origin = request.headers.get("origin") || request.nextUrl.origin || process.env.NEXTAUTH_URL || ""

    // Generate email HTML and plain text
    let html = generateEmailHtml(content, { articles, origin })
    if (customHtml?.trim()) {
      try {
        const context = buildNewsletterTemplateContext({ content, articles, origin })
        html = renderNewsletterTemplate(customHtml, context)
      } catch (error) {
        console.error("Failed to render custom HTML:", error)
        return NextResponse.json(
          { error: "Failed to render custom HTML", details: String(error) },
          { status: 400 }
        )
      }
    }
    const plainText = generatePlainText(content)

    // Get Resend API key
    const resendConfig = await prisma.apiKey.findUnique({
      where: { service: "resend" },
    })

    if (!resendConfig || !resendConfig.key) {
      return NextResponse.json(
        { error: "Resend API key not configured" },
        { status: 400 }
      )
    }

    const decryptedKey = decrypt(resendConfig.key)
    const resend = new Resend(decryptedKey)

    // Build from address
    const fromName = resendConfig.resendFromName || "cucina labs"
    const fromEmail = resendConfig.resendFromEmail || "newsletter@cucinalabs.com"
    const from = `${fromName} <${fromEmail}>`

    // Generate unsubscribe token for test email
    const crypto = await import("crypto")
    const token = crypto
      .createHmac("sha256", process.env.NEXTAUTH_SECRET || "")
      .update(testEmail)
      .digest("hex")

    // Replace unsubscribe placeholders
    const htmlWithUnsubscribe = html
      .replace(/\{\{email\}\}/g, encodeURIComponent(testEmail))
      .replace(/\{\{token\}\}/g, token)

    // Send test email
    console.log(`Sending test email to ${testEmail} from ${from}`)
    await resend.emails.send({
      from,
      to: testEmail,
      subject: "[TEST] AI Product Briefing - Daily Digest",
      html: htmlWithUnsubscribe,
      text: plainText,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to send test email:", error)
    return NextResponse.json(
      { error: "Failed to send test email", details: String(error) },
      { status: 500 }
    )
  }
}
