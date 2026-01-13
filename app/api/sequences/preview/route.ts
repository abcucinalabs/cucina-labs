import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateNewsletterContent, generateEmailHtml, getAllArticlesFromAirtable, getRecentArticles } from "@/lib/distribution"
import { prisma } from "@/lib/db"
import { logNewsActivity } from "@/lib/news-activity"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { systemPrompt, userPrompt, htmlTemplate } = body

    // Check if Airtable is configured
    const airtableConfig = await prisma.apiKey.findUnique({
      where: { service: "airtable" },
    })

    console.log("Airtable config check:", {
      hasKey: !!airtableConfig?.key,
      hasBaseId: !!airtableConfig?.airtableBaseId,
      hasTableId: !!airtableConfig?.airtableTableId,
      baseId: airtableConfig?.airtableBaseId,
      tableId: airtableConfig?.airtableTableId,
    })

    let articles: any[] = []
    let source = "local"

    // Try to get articles from Airtable first
    if (airtableConfig?.key && airtableConfig?.airtableBaseId && airtableConfig?.airtableTableId) {
      try {
        console.log("Attempting to fetch articles from Airtable...")
        articles = await getAllArticlesFromAirtable(20)
        console.log(`Fetched ${articles.length} articles from Airtable`)
        source = "airtable"
      } catch (error: any) {
        console.error("Failed to fetch from Airtable:", error.message || error)
        // Will fall back to local DB below
      }
    } else {
      console.log("Airtable not fully configured, skipping Airtable fetch")
    }

    // Fall back to local database if Airtable didn't work
    if (articles.length === 0) {
      articles = await getRecentArticles()
      source = "local"
    }

    if (articles.length === 0) {
      // Check Airtable configuration
      if (!airtableConfig?.airtableBaseId || !airtableConfig?.airtableTableId) {
        await logNewsActivity({
          event: "sequences.preview",
          status: "warning",
          message: "Preview failed: Airtable not configured.",
          metadata: { source },
        })
        return NextResponse.json({
          error: "Airtable not configured",
          details: "Please configure your Airtable integration on the Integrations tab. Select your Base and Table where articles are stored.",
        }, { status: 400 })
      }

      // Check if there are any articles in local database
      const totalLocalArticles = await prisma.article.count()
      
      if (totalLocalArticles === 0) {
        await logNewsActivity({
          event: "sequences.preview",
          status: "warning",
          message: "Preview failed: no articles found in Airtable or local DB.",
          metadata: { source },
        })
        return NextResponse.json({
          error: "No articles found",
          details: "No articles found in Airtable or the local database. Please ensure your Airtable table contains articles, or run the ingestion workflow to populate articles.",
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
          details: `Found ${totalLocalArticles} articles in local database but none from the last 24 hours. Check your Airtable connection or run ingestion again.`,
        }, { status: 400 })
      }
    }

    // Generate newsletter content
    const content = await generateNewsletterContent(
      articles,
      systemPrompt || "",
      userPrompt || ""
    )

    const origin = request.headers.get("origin") || request.nextUrl.origin || process.env.NEXTAUTH_URL || ""

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
    if (error.message?.includes("Airtable")) {
      await logNewsActivity({
        event: "sequences.preview",
        status: "error",
        message: "Preview failed: Airtable connection failed.",
        metadata: { details: error.message || String(error) },
      })
      return NextResponse.json({
        error: "Airtable connection failed",
        details: error.message || "Failed to connect to Airtable. Please check your API key and table configuration.",
      }, { status: 500 })
    }
    
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
