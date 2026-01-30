import Handlebars from "handlebars"

export interface WeeklyNewsletterData {
  weekOf: string // e.g., "January 27, 2025"
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
  recipes: Array<{
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
}

export const WEEKLY_NEWSLETTER_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>cucina labs Weekly - {{weekOf}}</title>
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

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 100%); padding: 32px 40px 36px;">
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
                    <p style="margin: 20px 0 10px; font-size: 11px; font-weight: 600; color: #9bf2ca; text-transform: uppercase; letter-spacing: 0.1em;">Weekly Newsletter</p>
                    <h1 style="margin: 0; font-size: 32px; font-weight: 600; color: #ffffff; line-height: 1.2; letter-spacing: -0.02em;">What's Cookin' This Week</h1>
                  </td>
                </tr>

                <!-- Chef's Table Section -->
                <tr>
                  <td style="padding: 36px 40px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 24px; background: linear-gradient(135deg, rgba(155, 242, 202, 0.2) 0%, rgba(155, 242, 202, 0.05) 100%); border-radius: 16px; border-left: 4px solid #9bf2ca;">
                          <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #4a51d9; margin-bottom: 12px;">
                            Chef's Table
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

                <!-- News Section -->
                {{#if news.length}}
                <tr>
                  <td style="padding: 32px 40px 0;">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #4a51d9; margin-bottom: 16px;">
                      News
                    </div>
                    <p style="margin: 0 0 20px; font-size: 13px; color: rgba(13, 13, 13, 0.6);">Top stories from the AI world this week</p>
                    {{#each news}}
                    <div style="padding-bottom: {{#unless @last}}20px{{else}}0{{/unless}}; margin-bottom: {{#unless @last}}20px{{else}}0{{/unless}}; border-bottom: {{#unless @last}}1px solid rgba(0, 0, 0, 0.06){{else}}none{{/unless}};">
                      <div style="display: flex; align-items: flex-start;">
                        <span style="display: inline-block; background: #0d0d0d; color: #9bf2ca; width: 24px; height: 24px; text-align: center; line-height: 24px; border-radius: 6px; font-size: 12px; font-weight: 700; margin-right: 12px; flex-shrink: 0;">{{math @index "+" 1}}</span>
                        <div>
                          <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #0d0d0d; line-height: 1.4;">
                            {{#if url}}<a href="{{url}}" style="color: #0d0d0d; text-decoration: none;">{{title}}</a>{{else}}{{title}}{{/if}}
                          </h3>
                          <p style="margin: 0; font-size: 14px; color: rgba(13, 13, 13, 0.7); line-height: 1.6;">{{summary}}</p>
                          {{#if url}}
                          <a href="{{url}}" style="display: inline-block; margin-top: 8px; color: #4a51d9; text-decoration: none; font-weight: 600; font-size: 13px;">Read more &rarr;</a>
                          {{/if}}
                        </div>
                      </div>
                    </div>
                    {{/each}}
                  </td>
                </tr>
                {{/if}}

                <!-- Recipes Section (Social Posts/Articles) -->
                {{#if recipes.length}}
                <tr>
                  <td style="padding: 32px 40px 0;">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #4a51d9; margin-bottom: 16px;">
                      Recipes
                    </div>
                    <p style="margin: 0 0 20px; font-size: 13px; color: rgba(13, 13, 13, 0.6);">Posts and articles we enjoyed this week</p>
                    {{#each recipes}}
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

                <!-- What We're Cooking Section -->
                {{#if cooking.length}}
                <tr>
                  <td style="padding: 32px 40px 0;">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #4a51d9; margin-bottom: 16px;">
                      What We're Cooking
                    </div>
                    <p style="margin: 0 0 20px; font-size: 13px; color: rgba(13, 13, 13, 0.6);">Our experiments and projects this week</p>
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

                <!-- Footer -->
                <tr>
                  <td style="padding: 36px 40px 40px;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.08), transparent); margin: 0 0 24px;"></div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; margin: 0 auto; text-align: center;">
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <p style="margin: 0 0 8px; color: rgba(13, 13, 13, 0.6); font-size: 13px; line-height: 1.6;">
                            You're receiving this because you subscribed to <strong>cucina labs</strong> weekly newsletter.
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

// Register math helper for index + 1
Handlebars.registerHelper('math', function(a: number, operator: string, b: number) {
  a = Number(a)
  b = Number(b)
  switch (operator) {
    case '+': return a + b
    case '-': return a - b
    case '*': return a * b
    case '/': return a / b
    default: return a
  }
})

export const renderWeeklyNewsletter = (data: WeeklyNewsletterData): string => {
  const template = Handlebars.compile(WEEKLY_NEWSLETTER_TEMPLATE)
  return template({
    ...data,
    currentYear: new Date().getFullYear(),
  })
}

export const buildWeeklyNewsletterContext = (
  newsletter: {
    weekStart: Date
    chefsTableTitle?: string | null
    chefsTableBody?: string | null
    newsItems?: any[] | null
    cookingItems?: any[] | null
  },
  savedRecipes: Array<{
    title: string
    url?: string | null
    description?: string | null
    source?: string | null
  }>,
  origin?: string
): WeeklyNewsletterData => {
  const weekOf = newsletter.weekStart.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const baseUrl = origin || ''
  const unsubscribeUrl = baseUrl ? `${baseUrl}/unsubscribe` : '/unsubscribe'

  return {
    weekOf,
    chefsTable: {
      title: newsletter.chefsTableTitle || undefined,
      body: newsletter.chefsTableBody || 'Welcome to this week\'s edition of our newsletter!',
    },
    news: (newsletter.newsItems || []).slice(0, 3).map((item: any) => ({
      title: item.title || item.Title || '',
      url: item.url || item.URL || item.Link || '',
      summary: item.summary || item.Summary || item.Description || '',
      source: item.source || item.Source || undefined,
    })),
    recipes: savedRecipes.map((recipe) => ({
      title: recipe.title,
      url: recipe.url || undefined,
      description: recipe.description || '',
      source: recipe.source || undefined,
    })),
    cooking: (newsletter.cookingItems || []).map((item: any) => ({
      title: item.title || '',
      description: item.description || '',
      url: item.url || undefined,
    })),
    unsubscribeUrl,
  }
}
