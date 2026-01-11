import { wrapRedirectUrl } from "./url-utils"

export const DEFAULT_NEWSLETTER_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${newsletter.subject || "cucina labs Briefing"}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.7; color: #0d0d0d; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
        <![endif]-->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border-radius: 20px; border: 1px solid rgba(0, 0, 0, 0.06); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); overflow: hidden;">
                <tr>
                  <td background="\${bannerUrl}" style="background-image: url('\${bannerUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat; border-radius: 20px 20px 0 0;">
                    <!--[if gte mso 9]>
                    <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:220px;">
                      <v:fill type="frame" src="\${bannerUrl}" color="#0d0d0d" />
                      <v:textbox inset="0,0,0,0">
                    <![endif]-->
                    <div>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td bgcolor="#0d0d0d" style="padding: 32px 40px 36px; background-color: rgba(13, 13, 13, 0.55);">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td align="left" style="font-size: 11px; font-weight: 600; color: #9bf2ca; text-transform: uppercase; letter-spacing: 0.1em;">
                                  cucina <strong>labs</strong>
                                </td>
                                <td align="right" style="font-size: 12px; color: rgba(255, 255, 255, 0.7);">
                                  \${formatDate(new Date())}
                                </td>
                              </tr>
                            </table>
                            <p style="margin: 20px 0 10px; font-size: 11px; font-weight: 600; color: #9bf2ca; text-transform: uppercase; letter-spacing: 0.1em;">AI Product Briefing</p>
                            <h1 style="margin: 0; font-size: 34px; font-weight: 600; color: #ffffff; line-height: 1.15; letter-spacing: -0.03em;">\${newsletter.subject || "cucina labs Briefing"}</h1>
                          </td>
                        </tr>
                      </table>
                    </div>
                    <!--[if gte mso 9]>
                      </v:textbox>
                    </v:rect>
                    <![endif]-->
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px 40px 40px;">
                    \${newsletter.intro ? '<p style="margin: 0 0 24px; font-size: 15px; color: rgba(13, 13, 13, 0.7); line-height: 1.7;">' + newsletter.intro + '</p>' : ""}
                    \${(() => {
                      const headline = newsletter.featured_story?.headline || featured.title || featured.headline || "";
                      if (!headline) return "";
                      const summary = newsletter.featured_story?.why_this_matters || featured.summary || featured.why_it_matters || "";
                      const link = featured.source_link || newsletter.featured_story?.link || "";
                      const image = featured.image_link || "";
                      const category = featured.category || "";
                      const creator = featured.creator || "";
                      return '<div style="margin: 32px 0; padding: 24px; border-radius: 16px; background: #fafafa; border: 1px solid rgba(0, 0, 0, 0.06); border-left: 3px solid #9bf2ca;">' +
                        (image ? '<img src="' + image + '" alt="' + headline + '" width="100%" style="display: block; border-radius: 12px; margin-bottom: 18px;">' : "") +
                        '<div style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #4a51d9; margin-bottom: 10px;">Featured</div>' +
                        (category || creator ? '<div style="margin: 0 0 10px;">' +
                          (category ? '<span style="display: inline-block; background: rgba(155, 242, 202, 0.6); color: #0d0d0d; padding: 4px 10px; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; border-radius: 999px; margin-right: 8px; font-weight: 600;">' + category + '</span>' : "") +
                          (creator ? '<span style="color: rgba(13, 13, 13, 0.5); font-size: 12px;">' + creator + '</span>' : "") +
                        '</div>' : "") +
                        '<h2 style="margin: 6px 0 12px; color: #0d0d0d; font-size: 20px; font-weight: 600; line-height: 1.3;">' + headline + '</h2>' +
                        (summary ? '<p style="margin: 0 0 16px; color: rgba(13, 13, 13, 0.7); font-size: 15px; line-height: 1.7;">' + summary + '</p>' : "") +
                        (link ? '<a href="' + link + '" style="color: #3c35f2; text-decoration: none; font-weight: 600; font-size: 14px;">Read full article -></a>' : "") +
                        '</div>';
                    })()}
                    \${(newsletter.top_stories || []).length ? '<div style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #4a51d9; margin: 24px 0 16px;">Top Stories</div>' : ""}
                    \${(newsletter.top_stories || []).map((story, idx) => {
                      const article = findArticle(story) || {};
                      const isLast = idx === newsletter.top_stories.length - 1;
                      const summary = story.why_read_it || story.summary || article.why_it_matters || article.summary || "";
                      const headline = story.headline || story.title || article.title || "";
                      const link = story.link || article.source_link || article.link || "";
                      const category = article.category || story.category || "";
                      const creator = article.creator || story.creator || "";
                      return '<div style="padding-bottom: ' + (isLast ? "0" : "24px") + '; margin-bottom: ' + (isLast ? "0" : "24px") + '; border-bottom: ' + (isLast ? "none" : "1px solid rgba(0, 0, 0, 0.06)") + ';">' +
                        (category || creator ? '<div style="margin-bottom: 10px;">' +
                          (category ? '<span style="display: inline-block; background: rgba(155, 242, 202, 0.6); color: #0d0d0d; padding: 4px 10px; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; border-radius: 999px; margin-right: 8px; font-weight: 600;">' + category + '</span>' : "") +
                          (creator ? '<span style="color: rgba(13, 13, 13, 0.5); font-size: 12px;">' + creator + '</span>' : "") +
                        '</div>' : "") +
                        '<h3 style="margin: 6px 0 10px; color: #0d0d0d; font-size: 18px; font-weight: 600; line-height: 1.4;">' + headline + '</h3>' +
                        (summary ? '<p style="margin: 0 0 12px; color: rgba(13, 13, 13, 0.7); font-size: 15px; line-height: 1.7;">' + summary + '</p>' : "") +
                        (link ? '<a href="' + link + '" style="color: #3c35f2; text-decoration: none; font-weight: 600; font-size: 14px;">Read more -></a>' : "") +
                        '</div>';
                    }).join("")}
                    \${newsletter.looking_ahead ? '<div style="margin-top: 28px; padding: 18px 20px; background: linear-gradient(135deg, rgba(155, 242, 202, 0.45) 0%, rgba(155, 242, 202, 0.12) 100%); border-left: 3px solid #9bf2ca; border-radius: 0 12px 12px 0;">' +
                      '<div style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #4a51d9; margin-bottom: 10px;">Looking Ahead</div>' +
                      '<p style="margin: 0; color: rgba(13, 13, 13, 0.65); font-size: 14px; line-height: 1.6;">' + newsletter.looking_ahead + '</p>' +
                    '</div>' : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px 40px 36px; text-align: center;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.08), transparent); margin: 0 0 20px;"></div>
                    <p style="margin: 0 0 10px; color: rgba(13, 13, 13, 0.5); font-size: 12px;">You are receiving this because you subscribed to cucina <strong>labs</strong>.</p>
                    <a href="\${unsubscribeUrl}" style="color: #3c35f2; text-decoration: none; font-weight: 600; font-size: 12px;">Unsubscribe</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <!--[if mso]>
            </td>
          </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`

export const normalizeNewsletterArticles = (articles: any[], origin?: string) =>
  (articles || []).map((article) => {
    const sourceLink = article.source_link || article.sourceLink || article.link || ""
    return {
      ...article,
      source_link: origin && sourceLink ? wrapRedirectUrl(sourceLink, origin) : sourceLink,
      image_link: article.image_link || article.imageUrl || article.image_url || "",
      summary: article.summary || article.aiSummary || article.ai_generated_summary || "",
      why_it_matters: article.whyItMatters || article.why_it_matters || "",
      business_value: article.businessValue || article.business_value || "",
    }
  })

export const buildNewsletterTemplateContext = ({
  content,
  articles,
  origin,
}: {
  content: any
  articles: any[]
  origin?: string
}) => {
  const featured = content?.featuredStory || content?.featured_story || {}
  const stories = content?.topStories || content?.top_stories || []
  const normalizedArticles = normalizeNewsletterArticles(articles || [], origin)

  const newsletter = {
    subject: content?.subject || "cucina labs Briefing",
    intro: content?.intro || "",
    featured_story: {
      id: featured?.id,
      headline: featured?.title || featured?.headline || "",
      why_this_matters: featured?.summary || featured?.why_this_matters || "",
      link: featured?.link && origin ? wrapRedirectUrl(featured.link, origin) : (featured?.link || ""),
    },
    top_stories: (stories || []).map((story: any) => ({
      id: story?.id,
      headline: story?.title || story?.headline || "",
      why_read_it: story?.summary || story?.why_read_it || "",
      link: story?.link && origin ? wrapRedirectUrl(story.link, origin) : (story?.link || ""),
      category: story?.category || "",
      creator: story?.creator || "",
    })),
    looking_ahead: content?.lookingAhead || content?.looking_ahead || "",
  }

  const findArticle = (story: any) => {
    if (!story) return null
    if (typeof story === "string") {
      return normalizedArticles.find((article) => article.id === story || article.source_link === story)
    }
    const storyId = story.id
    const storyLink = story.link
    const storyTitle = story.headline || story.title

    return (
      (storyId ? normalizedArticles.find((article) => article.id === storyId) : null) ||
      (storyLink
        ? normalizedArticles.find((article) => article.source_link === storyLink || article.link === storyLink)
        : null) ||
      (storyTitle
        ? normalizedArticles.find((article) => article.title === storyTitle)
        : null) ||
      null
    )
  }

  const featuredArticle = findArticle(newsletter.featured_story) || normalizedArticles[0] || {}

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  const baseUrl = origin || ""
  const unsubscribeUrl = `${baseUrl}/unsubscribe?email={{email}}&token={{token}}`
  const bannerUrl = `${baseUrl}/video-background-2-still.png`

  return {
    newsletter,
    articles: normalizedArticles,
    featured: featuredArticle,
    formatDate,
    findArticle,
    unsubscribeUrl,
    bannerUrl,
  }
}

export const renderNewsletterTemplate = (template: string, context: Record<string, any>) => {
  const keys = Object.keys(context)
  const values = Object.values(context)
  // eslint-disable-next-line no-new-func
  const renderer = new Function(...keys, `return \`${template}\`;`)
  return renderer(...values)
}
