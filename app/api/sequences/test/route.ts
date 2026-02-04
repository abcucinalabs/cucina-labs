import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { generateNewsletterContent, generateEmailHtml, generatePlainText, getRecentArticles } from "@/lib/distribution"
import { buildNewsletterTemplateContext, renderNewsletterTemplate } from "@/lib/newsletter-template"
import { findSequencePromptConfig, findApiKeyByService } from "@/lib/dal"
import { getServiceApiKey } from "@/lib/service-keys"

import { Resend } from "resend"
import { z } from "zod"
import {
  defaultSequenceSystemPrompt,
  defaultSequenceUserPrompt,
} from "@/lib/sequence-prompt-defaults"

export const dynamic = 'force-dynamic'

const testSchema = z.object({
  testEmail: z.string().email(),
  subject: z.string().optional(),
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

    let articles: any[] = []
    articles = await getRecentArticles()

    if (articles.length === 0) {
      return NextResponse.json(
        { error: "No articles available. Please run ingestion first." },
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
    const customSubject = parsed.subject?.trim()
    const generatedSubject =
      typeof content.subject === "string" ? content.subject.trim() : ""
    const resolvedSubject =
      customSubject || generatedSubject || "AI Product Briefing - Daily Digest"
    content.subject = resolvedSubject

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
    const apiKey = await getServiceApiKey("resend")

    if (!apiKey) {
      return NextResponse.json(
        { error: "Resend API key not configured" },
        { status: 400 }
      )
    }
    const resend = new Resend(apiKey)

    // Build from address
    const fromName = resendConfig.resendFromName || "cucina labs"
    const fromEmail = resendConfig.resendFromEmail || "newsletter@cucinalabs.com"
    const from = `${fromName} <${fromEmail}>`

    // Send test email
    console.log(`Sending test email to ${testEmail} from ${from}`)
    const unsubscribeUrl = `${origin}/unsubscribe?email=${encodeURIComponent(testEmail)}`
    await resend.emails.send({
      from,
      to: testEmail,
      subject: `[TEST] ${resolvedSubject}`,
      html,
      text: plainText,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
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
