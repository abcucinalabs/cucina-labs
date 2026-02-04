import Handlebars from "handlebars"

export interface WeeklyNewsletterData {
  weekOf: string
  chefsTable: {
    title?: string
    body: string
  }
  news: Array<{
    title: string
    url: string
    summary: string
    source?: string
  }>
  reading: Array<{
    title: string
    url?: string
    description: string
    source?: string
  }>
  cooking: Array<{
    title: string
    description: string
    url?: string
  }>
  unsubscribeUrl: string
  bannerUrl: string
}

export const WEEKLY_NEWSLETTER_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
  <title>cucina labs Weekly - {{weekOf}}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    u + #body a { color: inherit; text-decoration: none; }
    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
    @media only screen and (max-width: 600px) {
      .mobile-wrapper { padding: 12px 0 !important; }
      .mobile-content { padding: 24px 16px !important; }
      .mobile-header { padding: 24px 16px 28px !important; }
      .mobile-footer { padding: 20px 16px 28px !important; }
      .mobile-card { border-radius: 0 !important; }
    }
  </style>
</head>
<body id="body" style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.7; color: #0d0d0d; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" class="mobile-wrapper" style="padding: 40px 20px;">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
        <![endif]-->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="mobile-card" style="background: #ffffff; border-radius: 20px; border: 1px solid rgba(0, 0, 0, 0.06); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); overflow: hidden;">
                <tr>
                  <td background="{{bannerUrl}}" class="mobile-card" style="background-image: url('{{bannerUrl}}'); background-size: cover; background-position: center; background-repeat: no-repeat; border-radius: 20px 20px 0 0;">
                    <!--[if gte mso 9]>
                    <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:220px;">
                      <v:fill type="frame" src="{{bannerUrl}}" color="#0d0d0d" />
                      <v:textbox inset="0,0,0,0">
                    <![endif]-->
                    <div>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td bgcolor="#0d0d0d" class="mobile-header" style="padding: 32px 40px 36px; background-color: rgba(13, 13, 13, 0.55);">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td align="left" style="font-size: 11px; font-weight: 600; color: #9bf2ca; text-transform: uppercase; letter-spacing: 0.1em;">
                                  cucina <strong>labs</strong>
                                </td>
                                <td align="right" style="font-size: 12px; color: rgba(255, 255, 255, 0.7);">
                                  Week of {{weekOf}}
                                </td>
                              </tr>
                            </table>
                            <p style="margin: 20px 0 10px; font-size: 11px; font-weight: 600; color: #9bf2ca; text-transform: uppercase; letter-spacing: 0.1em;">AI Product Briefing</p>
                            <h1 style="margin: 0; font-size: 34px; font-weight: 600; color: #ffffff; line-height: 1.15; letter-spacing: -0.03em;">Weekly Menu</h1>
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
                  <td class="mobile-content" style="padding: 36px 40px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 24px; background: linear-gradient(135deg, rgba(155, 242, 202, 0.2) 0%, rgba(155, 242, 202, 0.05) 100%); border-radius: 16px; border-left: 4px solid #9bf2ca;">
                          <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #4a51d9; margin-bottom: 12px;">
                            From the Chef's Table
                          </div>
                          {{#if chefsTable.title}}
                          <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 600; color: #0d0d0d; line-height: 1.3;">{{chefsTable.title}}</h2>
                          {{/if}}
                          <p style="margin: 0; font-size: 15px; color: rgba(13, 13, 13, 0.75); line-height: 1.7;">{{chefsTable.body}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {{#if news.length}}
                <tr>
                  <td class="mobile-content" style="padding: 32px 40px 0;">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #4a51d9; margin-bottom: 16px;">News</div>
                    {{#each news}}
                    <div style="padding-bottom: {{#unless @last}}20px{{else}}0{{/unless}}; margin-bottom: {{#unless @last}}20px{{else}}0{{/unless}}; border-bottom: {{#unless @last}}1px solid rgba(0, 0, 0, 0.06){{else}}none{{/unless}};">
                      <div style="display: flex; align-items: flex-start;">
                        <span style="display: inline-block; background: #0d0d0d; color: #9bf2ca; width: 24px; height: 24px; text-align: center; line-height: 24px; border-radius: 6px; font-size: 12px; font-weight: 700; margin-right: 12px; flex-shrink: 0;">{{math @index "+" 1}}</span>
                        <div>
                          <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #0d0d0d; line-height: 1.4;">
                            {{#if url}}<a href="{{url}}" style="color: #0d0d0d; text-decoration: none;">{{title}}</a>{{else}}{{title}}{{/if}}
                          </h3>
                          {{#if source}}
                          <p style="margin: 0 0 6px; font-size: 11px; color: rgba(13, 13, 13, 0.5); text-transform: uppercase; letter-spacing: 0.08em;">{{source}}</p>
                          {{/if}}
                          <p style="margin: 0; font-size: 14px; color: rgba(13, 13, 13, 0.7); line-height: 1.6;">{{summary}}</p>
                        </div>
                      </div>
                    </div>
                    {{/each}}
                  </td>
                </tr>
                {{/if}}

                {{#if reading.length}}
                <tr>
                  <td class="mobile-content" style="padding: 32px 40px 0;">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #4a51d9; margin-bottom: 16px;">What We're Reading</div>
                    {{#each reading}}
                    <div style="padding: 16px 18px; margin-bottom: {{#unless @last}}12px{{else}}0{{/unless}}; background: #fafafa; border-radius: 12px; border: 1px solid rgba(0, 0, 0, 0.04);">
                      <h4 style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: #0d0d0d; line-height: 1.4;">
                        {{#if url}}<a href="{{url}}" style="color: #0d0d0d; text-decoration: none;">{{title}}</a>{{else}}{{title}}{{/if}}
                      </h4>
                      {{#if source}}
                      <span style="display: inline-block; background: rgba(74, 81, 217, 0.1); color: #4a51d9; padding: 2px 8px; font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase; border-radius: 4px; margin-bottom: 8px; font-weight: 600;">{{source}}</span>
                      {{/if}}
                      <p style="margin: 0; font-size: 14px; color: rgba(13, 13, 13, 0.7); line-height: 1.6;">{{description}}</p>
                    </div>
                    {{/each}}
                  </td>
                </tr>
                {{/if}}

                {{#if cooking.length}}
                <tr>
                  <td class="mobile-content" style="padding: 32px 40px 0;">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #4a51d9; margin-bottom: 16px;">What We're Cooking</div>
                    {{#each cooking}}
                    <div style="padding: 18px 20px; margin-bottom: {{#unless @last}}12px{{else}}0{{/unless}}; background: linear-gradient(135deg, rgba(74, 81, 217, 0.08) 0%, rgba(74, 81, 217, 0.02) 100%); border-radius: 12px; border: 1px solid rgba(74, 81, 217, 0.12);">
                      <h4 style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: #0d0d0d; line-height: 1.4;">
                        {{#if url}}<a href="{{url}}" style="color: #4a51d9; text-decoration: none;">{{title}}</a>{{else}}{{title}}{{/if}}
                      </h4>
                      <p style="margin: 0; font-size: 14px; color: rgba(13, 13, 13, 0.7); line-height: 1.6;">{{description}}</p>
                      {{#if url}}
                      <a href="{{url}}" style="display: inline-block; margin-top: 10px; color: #4a51d9; text-decoration: none; font-weight: 600; font-size: 13px;">Check it out &rarr;</a>
                      {{/if}}
                    </div>
                    {{/each}}
                  </td>
                </tr>
                {{/if}}

                <tr>
                  <td class="mobile-footer" style="padding: 36px 40px 40px;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.08), transparent); margin: 0 0 24px;"></div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; margin: 0 auto; text-align: center;">
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <p style="margin: 0 0 8px; color: rgba(13, 13, 13, 0.6); font-size: 13px; line-height: 1.6;">
                            You are receiving this email because you subscribed to the <strong>cucina labs</strong> weekly briefing.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <a href="{{unsubscribeUrl}}" style="display: inline-block; color: #ffffff; background-color: #3c35f2; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 24px; border-radius: 8px; margin-bottom: 8px;">Unsubscribe</a>
                          <p style="margin: 8px 0 0; color: rgba(13, 13, 13, 0.5); font-size: 11px;">
                            You can unsubscribe at any time by clicking the link above.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 12px; border-top: 1px solid rgba(0, 0, 0, 0.06);">
                          <p style="margin: 0 0 8px; color: rgba(13, 13, 13, 0.6); font-size: 12px; line-height: 1.6;">
                            <strong>cucina labs</strong>
                          </p>
                          <p style="margin: 8px 0 0; color: rgba(13, 13, 13, 0.5); font-size: 11px;">
                            &copy; {{currentYear}} cucina labs. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
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

Handlebars.registerHelper("math", function (a: number, operator: string, b: number) {
  const left = Number(a)
  const right = Number(b)
  switch (operator) {
    case "+":
      return left + right
    case "-":
      return left - right
    case "*":
      return left * right
    case "/":
      return left / right
    default:
      return left
  }
})

export const renderWeeklyNewsletter = (data: WeeklyNewsletterData): string => {
  const template = Handlebars.compile(WEEKLY_NEWSLETTER_TEMPLATE)
  return template({
    ...data,
    currentYear: new Date().getFullYear(),
  })
}

const isWithinLastDays = (value: string | undefined, days: number): boolean => {
  if (!value) return false
  const createdAt = new Date(value)
  if (Number.isNaN(createdAt.getTime())) return false
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return createdAt >= cutoff
}

const sortByCreatedAtDesc = <T extends { createdAt?: string | null }>(items: T[]): T[] =>
  [...items].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bTime - aTime
  })

export const buildWeeklyNewsletterContext = (
  newsletter: {
    weekStart: Date
    chefsTableTitle?: string | null
    chefsTableBody?: string | null
    newsItems?: any[] | null
  },
  savedRecipes: Array<{
    title: string
    url?: string | null
    description?: string | null
    source?: string | null
    createdAt?: string | null
  }>,
  savedCooking: Array<{
    title: string
    url?: string | null
    description?: string | null
    createdAt?: string | null
  }>,
  origin?: string
): WeeklyNewsletterData => {
  const weekOf = newsletter.weekStart.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const sortedRecipes = sortByCreatedAtDesc(savedRecipes || [])
  const recentRecipes = sortedRecipes.filter((recipe) => isWithinLastDays(recipe.createdAt || undefined, 7))

  const sortedCooking = sortByCreatedAtDesc(savedCooking || [])

  const baseUrl = origin || ""
  const unsubscribeUrl = baseUrl ? `${baseUrl}/unsubscribe` : "/unsubscribe"
  const bannerUrl = `${baseUrl}/video-background-2-still.png`

  return {
    weekOf,
    chefsTable: {
      title: newsletter.chefsTableTitle || undefined,
      body: newsletter.chefsTableBody || "Hey Chefs! Here's the weekly menu and the ideas worth bringing into your product work.",
    },
    news: (newsletter.newsItems || []).slice(0, 3).map((item: any) => ({
      title: item.title || item.Title || "",
      url: item.url || item.URL || item.Link || "",
      summary: item.summary || item.Summary || item.Description || "",
      source: item.source || item.Source || undefined,
    })),
    reading: recentRecipes.slice(0, 5).map((recipe) => ({
      title: recipe.title,
      url: recipe.url || undefined,
      description: recipe.description || "",
      source: recipe.source || undefined,
    })),
    cooking: sortedCooking.slice(0, 1).map((item) => ({
      title: item.title,
      description: item.description || "",
      url: item.url || undefined,
    })),
    unsubscribeUrl,
    bannerUrl,
  }
}
