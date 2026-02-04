import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { generateNewsletterContent, generateEmailHtml, getRecentArticles, wrapNewsletterWithShortLinks } from "@/lib/distribution"
import { findSequencePromptConfig, countArticles } from "@/lib/dal"
import { logNewsActivity } from "@/lib/news-activity"
import {
  defaultSequenceSystemPrompt,
  defaultSequenceUserPrompt,
} from "@/lib/sequence-prompt-defaults"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    let { systemPrompt, userPrompt, htmlTemplate, dayOfWeek, contentSources, subject } = body

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
    const source = "local"

    articles = await getRecentArticles(dayOfWeek ? { dayOfWeek } : undefined)

    if (articles.length === 0) {
      const totalLocalArticles = await countArticles()

      if (totalLocalArticles === 0) {
        await logNewsActivity({
          event: "sequences.preview",
          status: "warning",
          message: "Preview failed: no articles found in local DB.",
          metadata: { source },
        })
        return NextResponse.json({
          error: "No articles found",
          details: "No articles found in the local database. Please run the ingestion workflow to populate articles.",
        }, { status: 400 })
      } else {
        await logNewsActivity({
          event: "sequences.preview",
          status: "warning",
          message: "Preview failed: no recent articles in local DB.",
          metadata: { source, totalLocalArticles },
        })
        return NextResponse.json({
          error: "No recent articles",
          details: `Found ${totalLocalArticles} articles in local database but none from the last 24 hours. Run ingestion again.`,
        }, { status: 400 })
      }
    }

    // Generate newsletter content
    let content = await generateNewsletterContent(
      articles,
      systemPrompt || "",
      userPrompt || "",
      { contentSources: contentSources || [] }
    )
    const customSubject = typeof subject === "string" ? subject.trim() : ""
    if (customSubject) {
      content.subject = customSubject
    }

    // Wrap URLs with branded short links (using undefined for preview - no sequenceId)
    content = await wrapNewsletterWithShortLinks(content, articles, undefined)

    const origin = request.headers.get("origin") || request.nextUrl.origin || process.env.NEXT_PUBLIC_BASE_URL || ""

    // Generate HTML with custom template if provided
    const html = generateEmailHtml(content, {
      articles,
      origin,
      template: htmlTemplate
    })

    await logNewsActivity({
      event: "sequences.preview",
      status: "success",
      message: "Generated sequence preview.",
      metadata: { source, articleCount: articles.length },
    })

    return NextResponse.json({ 
      html,
      content,
      articles,
      meta: {
        articleCount: articles.length,
        source,
      }
    })
  } catch (error: any) {
    console.error("Failed to generate preview:", error)
    
    // Provide more specific error messages
    if (error.message?.includes("Gemini")) {
      await logNewsActivity({
        event: "sequences.preview",
        status: "error",
        message: "Preview failed: Gemini generation error.",
        metadata: { details: error.message || String(error) },
      })
      return NextResponse.json({
        error: "AI generation failed",
        details: error.message || "Failed to generate content with Gemini. Please check your Gemini API key.",
      }, { status: 500 })
    }

    await logNewsActivity({
      event: "sequences.preview",
      status: "error",
      message: "Preview failed: unexpected error.",
      metadata: { details: error.message || String(error) },
    })
    return NextResponse.json(
      { error: "Failed to generate preview", details: String(error) },
      { status: 500 }
    )
  }
}
