import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { generateNewsletterContent, generateEmailHtml, generatePlainText, getAllArticlesFromAirtable, getRecentArticles } from "@/lib/distribution"
import { buildNewsletterTemplateContext, renderNewsletterTemplate } from "@/lib/newsletter-template"
import { decryptWithMetadata, encrypt } from "@/lib/encryption"
import { findSequencePromptConfig, findApiKeyByService, updateApiKey } from "@/lib/dal"
import { Resend } from "resend"
import { z } from "zod"
import {
  defaultSequenceSystemPrompt,
  defaultSequenceUserPrompt,
} from "@/lib/sequence-prompt-defaults"

export const dynamic = 'force-dynamic'

const testSchema = z.object({
  testEmail: z.string().email(),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().optional(),
  customHtml: z.string().optional(),
  contentSources: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = testSchema.parse(body)
    const { testEmail, customHtml } = parsed
    let systemPrompt = parsed.systemPrompt
    let userPrompt = parsed.userPrompt

    // Load global prompts if not provided
    if (!systemPrompt || !userPrompt) {
      let globalConfig: { systemPrompt?: string; userPrompt?: string } | null = null
      try {
        globalConfig = await findSequencePromptConfig()
      } catch {
        // Table may not exist yet if migration hasn't run
      }
      if (!systemPrompt) {
        systemPrompt = globalConfig?.systemPrompt || defaultSequenceSystemPrompt
      }
      if (!userPrompt) {
        userPrompt = globalConfig?.userPrompt || defaultSequenceUserPrompt
      }
    }

    // Check Airtable config
    const airtableConfig = await findApiKeyByService("airtable")

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
      userPrompt || "",
      { contentSources: parsed.contentSources || [] }
    )

    const origin = request.headers.get("origin") || request.nextUrl.origin || process.env.NEXT_PUBLIC_BASE_URL || ""

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
    const resendConfig = await findApiKeyByService("resend")

    if (!resendConfig || !resendConfig.key) {
      return NextResponse.json(
        { error: "Resend API key not configured" },
        { status: 400 }
      )
    }

    const { plaintext, needsRotation } = decryptWithMetadata(resendConfig.key)
    if (needsRotation) {
      await updateApiKey(resendConfig.id, { key: encrypt(plaintext) })
    }
    const resend = new Resend(plaintext)

    // Build from address
    const fromName = resendConfig.resendFromName || "cucina labs"
    const fromEmail = resendConfig.resendFromEmail || "newsletter@cucinalabs.com"
    const from = `${fromName} <${fromEmail}>`

    // Send test email
    console.log(`Sending test email to ${testEmail} from ${from}`)
    await resend.emails.send({
      from,
      to: testEmail,
      subject: "[TEST] AI Product Briefing - Daily Digest",
      html,
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
