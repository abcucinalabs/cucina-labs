import Handlebars from "handlebars"
import { wrapRedirectUrl } from "./url-utils"

const redirectorDomains = new Set([
  "t.co",
  "bit.ly",
  "lnkd.in",
  "trib.al",
  "tinyurl.com",
  "goo.gl",
  "news.google.com",
  "link.medium.com",
  "mailchi.mp",
  "r.mailchimp.com",
  "l.facebook.com",
  "www.google.com",
  "google.com",
])

const normalizeUrl = (value?: string): string => {
  if (!value) return ""
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return trimmed
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

const hostnameFromUrl = (value?: string): string => {
  const normalized = normalizeUrl(value)
  if (!normalized) return ""
  try {
    const host = new URL(normalized).hostname.toLowerCase()
    return host.startsWith("www.") ? host.slice(4) : host
  } catch {
    return ""
  }
}

const unwrapRedirectUrl = (value?: string): string => {
  const normalized = normalizeUrl(value)
  if (!normalized) return ""
  try {
    const urlObj = new URL(normalized)
    const host = urlObj.hostname.toLowerCase()
    const params = urlObj.searchParams
    let candidate = ""

    if ((host === "www.google.com" || host === "google.com") && urlObj.pathname === "/url") {
      candidate = params.get("q") || params.get("url") || ""
    } else if (host === "l.facebook.com" && urlObj.pathname === "/l.php") {
      candidate = params.get("u") || ""
    } else {
      candidate =
        params.get("url") ||
        params.get("u") ||
        params.get("target") ||
        params.get("dest") ||
        ""
    }

    const normalizedCandidate = normalizeUrl(candidate)
    if (normalizedCandidate && hostnameFromUrl(normalizedCandidate)) {
      return normalizedCandidate
    }
    return normalized
  } catch {
    return normalized
  }
}

const isRedirectorHost = (host: string) => redirectorDomains.has(host)

export const SYSTEM_DAILY_TEMPLATE_ID = "system-daily-insights"
export const SYSTEM_WEEKLY_TEMPLATE_ID = "system-weekly-update"
export const SYSTEM_WELCOME_TEMPLATE_ID = "system-welcome"

const buildAllowlist = (articles: any[]): Set<string> => {
  const allowlist = new Set<string>()
  for (const article of articles || []) {
    const candidates = [
      article?.source_link,
      article?.link,
      article?.url,
      article?.guid,
    ]

    for (const candidate of candidates) {
      const unwrapped = unwrapRedirectUrl(candidate)
      const host = hostnameFromUrl(unwrapped)
      if (!host || isRedirectorHost(host)) continue
      allowlist.add(host)
      break
    }
  }
  return allowlist
}

const safeLink = (
  candidates: Array<string | undefined | null>,
  allowlist: Set<string>,
  debug?: boolean
): string => {
  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate || "")
    if (!normalized) {
      if (debug) {
        console.log("safeLink skip: empty candidate")
      }
      continue
    }

    const unwrapped = unwrapRedirectUrl(normalized)
    const host = hostnameFromUrl(unwrapped)
    if (!host) {
      if (debug) {
        console.log("safeLink skip: invalid hostname", { candidate: normalized })
      }
      continue
    }

    if (isRedirectorHost(host)) {
      if (debug) {
        console.log("safeLink skip: redirector host", { candidate: normalized, host })
      }
      continue
    }

    if (!allowlist.has(host)) {
      if (debug) {
        console.log("safeLink skip: not in allowlist", { candidate: normalized, host })
      }
      continue
    }

    if (debug) {
      console.log("safeLink accepted", { candidate: normalized, resolved: unwrapped, host })
    }
    return unwrapped
  }

  if (debug) {
    console.log("safeLink failed: no candidates accepted", { candidates })
  }
  return ""
}

export const DEFAULT_NEWSLETTER_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
  <title>\${newsletter.subject || "cucina labs Briefing"}</title>
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
      .mobile-heading { font-size: 28px !important; }
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
                  <td background="\${bannerUrl}" class="mobile-card" style="background-image: url('\${bannerUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat; border-radius: 20px 20px 0 0;">
                    <!--[if gte mso 9]>
                    <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:220px;">
                      <v:fill type="frame" src="\${bannerUrl}" color="#0d0d0d" />
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
                                  \${currentDate}
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
                  <td class="mobile-content" style="padding: 36px 40px 40px;">
                    \${newsletter.intro ? '<p style="margin: 0 0 24px; font-size: 15px; color: rgba(13, 13, 13, 0.7); line-height: 1.7;">' + newsletter.intro + '</p>' : ""}
                    \${(() => {
                      const trimText = (value, max = 120) => {
                        if (!value) return "";
                        return value.length > max ? value.slice(0, max).trimEnd() + "..." : value;
                      };
                      const highlights = [];
                      const featuredHeadline = newsletter.featured_story?.headline || featured.title || featured.headline || "";
                      const featuredLink = safeLink([
                        newsletter.featured_story?.link,
                        newsletter.featured_story?.source_link,
                        featured.source_link,
                        featured.link
                      ]);
                      const featuredSummary = newsletter.featured_story?.why_this_matters || featured.summary || featured.why_it_matters || "";
                      if (featuredHeadline) {
                        highlights.push({
                          headline: featuredHeadline,
                          link: featuredLink,
                          summary: trimText(featuredSummary),
                        });
                      }
                      (newsletter.top_stories || []).slice(0, 3).forEach((story) => {
                        const headline = story.headline || "";
                        if (!headline) return;
                        highlights.push({
                          headline,
                          link: safeLink([story.link, story.source_link]),
                          summary: trimText(story.why_read_it || ""),
                        });
                      });
                      if (!highlights.length) return "";
                      return '<div style="margin: 0 0 28px; padding: 16px 18px; border-radius: 14px; background: rgba(155, 242, 202, 0.18); border: 1px solid rgba(155, 242, 202, 0.5);">' +
                        '<div style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #4a51d9; margin-bottom: 10px;">Today\\'s Highlights</div>' +
                        '<ul style="margin: 0; padding-left: 18px; color: rgba(13, 13, 13, 0.75); font-size: 14px; line-height: 1.6;">' +
                        highlights.map((item) => {
                          const headline = item.link
                            ? '<a href="' + item.link + '" style="color: #0d0d0d; text-decoration: none; font-weight: 600;">' + item.headline + '</a>'
                            : '<span style="font-weight: 600;">' + item.headline + '</span>';
                          return '<li style="margin-bottom: 8px;">' + headline +
                            (item.summary ? '<span style="color: rgba(13, 13, 13, 0.6);"> — ' + item.summary + '</span>' : '') +
                          '</li>';
                        }).join("") +
                        '</ul>' +
                      '</div>';
                    })()}
                    \${(() => {
                      const headline = newsletter.featured_story?.headline || featured.title || featured.headline || "";
                      if (!headline) return "";
                      const summary = newsletter.featured_story?.why_this_matters || featured.summary || featured.why_it_matters || "";
                      const link = safeLink([
                        featured.source_link,
                        featured.link,
                        newsletter.featured_story?.link,
                        newsletter.featured_story?.source_link
                      ]);
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
                        (link ? '<a href="' + link + '" style="color: #4a51d9; text-decoration: none; font-weight: 600; font-size: 14px;">Read full article -></a>' : "") +
                        '</div>';
                    })()}
                    \${(newsletter.top_stories || []).length ? '<div style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #4a51d9; margin: 24px 0 16px;">Top Stories</div>' : ""}
                    \${(newsletter.top_stories || []).map((story, idx) => {
                      const article = findArticle(story) || {};
                      const isLast = idx === newsletter.top_stories.length - 1;
                      const summary = story.why_read_it || story.summary || article.why_it_matters || article.summary || "";
                      const headline = story.headline || story.title || article.title || "";
                      const link = safeLink([
                        story.link,
                        story.source_link,
                        article.source_link,
                        article.link
                      ]);
                      const category = article.category || story.category || "";
                      const creator = article.creator || story.creator || "";
                      return '<div style="padding-bottom: ' + (isLast ? "0" : "24px") + '; margin-bottom: ' + (isLast ? "0" : "24px") + '; border-bottom: ' + (isLast ? "none" : "1px solid rgba(0, 0, 0, 0.06)") + ';">' +
                        (category || creator ? '<div style="margin-bottom: 10px;">' +
                          (category ? '<span style="display: inline-block; background: rgba(155, 242, 202, 0.6); color: #0d0d0d; padding: 4px 10px; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; border-radius: 999px; margin-right: 8px; font-weight: 600;">' + category + '</span>' : "") +
                          (creator ? '<span style="color: rgba(13, 13, 13, 0.5); font-size: 12px;">' + creator + '</span>' : "") +
                        '</div>' : "") +
                        '<h3 style="margin: 6px 0 10px; color: #0d0d0d; font-size: 18px; font-weight: 600; line-height: 1.4;">' + headline + '</h3>' +
                        (summary ? '<p style="margin: 0 0 12px; color: rgba(13, 13, 13, 0.7); font-size: 15px; line-height: 1.7;">' + summary + '</p>' : "") +
                        (link ? '<a href="' + link + '" style="color: #4a51d9; text-decoration: none; font-weight: 600; font-size: 14px;">Read more -></a>' : "") +
                        '</div>';
                    }).join("")}
                    \${newsletter.looking_ahead ? '<div style="margin-top: 28px; padding: 18px 20px; background: linear-gradient(135deg, rgba(155, 242, 202, 0.45) 0%, rgba(155, 242, 202, 0.12) 100%); border-left: 3px solid #9bf2ca; border-radius: 0 12px 12px 0;">' +
                      '<div style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #4a51d9; margin-bottom: 10px;">Looking Ahead</div>' +
                      '<p style="margin: 0; color: rgba(13, 13, 13, 0.65); font-size: 14px; line-height: 1.6;">' + newsletter.looking_ahead + '</p>' +
                    '</div>' : ""}
                  </td>
                </tr>
                <tr>
                  <td class="mobile-footer" style="padding: 24px 40px 36px; text-align: center;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.08), transparent); margin: 0 0 20px;"></div>

                    <!-- CAN-SPAM Compliant Footer -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; margin: 0 auto;">
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <p style="margin: 0 0 8px; color: rgba(13, 13, 13, 0.6); font-size: 13px; line-height: 1.6;">
                            You are receiving this email because you subscribed to the <strong>cucina labs</strong> AI Product Briefing newsletter.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <a href="\${unsubscribeUrl}" style="display: inline-block; color: #ffffff; background-color: #3c35f2; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 24px; border-radius: 8px; margin-bottom: 8px;">Unsubscribe</a>
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
                            © \${new Date().getFullYear()} cucina labs. All rights reserved.
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

export const WEEKLY_UPDATE_NEWSLETTER_TEMPLATE = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>\${newsletter.subject || "Building AI Products - Weekly Menu"}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    u + #body a { color: inherit; text-decoration: none; font-size: inherit; font-family: inherit; font-weight: inherit; line-height: inherit; }
    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
    div[style*="margin: 16px 0"] { margin: 0 !important; }
    @media only screen and (max-width: 600px) {
      .mobile-wrapper { padding: 12px 0 !important; }
      .mobile-content { padding: 24px 16px !important; }
      .mobile-header { padding: 24px 16px 28px !important; }
      .mobile-footer { padding: 20px 16px 28px !important; }
      .mobile-card { border-radius: 0 !important; }
      .mobile-heading { font-size: 28px !important; }
      .mobile-text { font-size: 16px !important; }
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
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="mobile-card" style="background: #ffffff; border: 1px solid rgba(0, 0, 0, 0.06); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); overflow: hidden;">
                <tr>
                  <td bgcolor="#0d0d0d" class="mobile-header" style="padding: 32px 40px 36px; background-color: #0d0d0d;">
                    <h1 style="margin: 0 0 8px; font-size: 48px; font-weight: 400; color: #ffffff; line-height: 1.1; letter-spacing: -0.02em;">cucina <strong style="font-weight: 700;">labs</strong></h1>
                    <p style="margin: 0 0 20px; font-size: 12px; color: rgba(255, 255, 255, 0.5);">\${currentDate}</p>
                    <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: rgba(255, 255, 255, 0.7); text-transform: uppercase; letter-spacing: 0.15em;">Weekly Update</p>
                  </td>
                </tr>
                <tr>
                  <td class="mobile-content" style="padding: 40px 40px;">
                    \${weekly?.from_chefs_table?.body ? '<div style="margin: 0 0 28px; padding: 18px 20px; background: #fafafa; border-left: 3px solid #0d0d0d;">' +
                      '<p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #0d0d0d; text-transform: uppercase; letter-spacing: 0.1em;">From the Chef\\'s Table</p>' +
                      (weekly.from_chefs_table.title ? '<h2 style="margin: 0 0 10px; color: #0d0d0d; font-size: 20px; font-weight: 700; line-height: 1.3;">' + weekly.from_chefs_table.title + '</h2>' : "") +
                      '<p style="margin: 0; color: #0d0d0d; font-size: 15px; line-height: 1.6;">' + weekly.from_chefs_table.body + '</p>' +
                    '</div>' : ""}

                    \${(weekly?.news || []).length ? '<h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #0d0d0d; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #0d0d0d; padding-bottom: 8px;">News</h2>' : ""}
                    \${(weekly?.news || []).map((story, idx) => {
                      const isLast = idx === weekly.news.length - 1;
                      const headline = story.headline || story.title || "";
                      const summary = story.why_this_matters || story.summary || "";
                      const link = safeLink([story.link, story.url, story.source_link]);
                      if (!headline) return "";
                      return '<div style="padding-bottom: ' + (isLast ? "0" : "24px") + '; margin-bottom: ' + (isLast ? "0" : "24px") + '; border-bottom: ' + (isLast ? "none" : "1px solid rgba(0, 0, 0, 0.08)") + ';">' +
                        '<h3 style="margin: 6px 0 10px; color: #0d0d0d; font-size: 18px; font-weight: 700; line-height: 1.4;">' + headline + '</h3>' +
                        (summary ? '<p style="margin: 0 0 12px; color: #0d0d0d; font-size: 15px; line-height: 1.6;">' + summary + '</p>' : "") +
                        (link ? '<a href="' + link + '" target="_blank" rel="noopener noreferrer" style="color: #3c35f2; text-decoration: underline; font-weight: 600; font-size: 14px;">Read more →</a>' : "") +
                      '</div>';
                    }).join("")}

                    \${(weekly?.what_were_reading || []).length ? '<h2 style="margin: 24px 0 16px; font-size: 16px; font-weight: 700; color: #0d0d0d; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #0d0d0d; padding-bottom: 8px;">What We\\'re Reading</h2>' : ""}
                    \${(weekly?.what_were_reading || []).map((item, idx) => {
                      const isLast = idx === weekly.what_were_reading.length - 1;
                      const title = item.title || "";
                      const description = item.description || item.summary || "";
                      const link = safeLink([item.url, item.link]);
                      if (!title) return "";
                      return '<div style="padding-bottom: ' + (isLast ? "0" : "20px") + '; margin-bottom: ' + (isLast ? "0" : "20px") + '; border-bottom: ' + (isLast ? "none" : "1px solid rgba(0, 0, 0, 0.08)") + ';">' +
                        '<h3 style="margin: 6px 0 10px; color: #0d0d0d; font-size: 17px; font-weight: 700; line-height: 1.4;">' + title + '</h3>' +
                        (description ? '<p style="margin: 0 0 12px; color: #0d0d0d; font-size: 15px; line-height: 1.6;">' + description + '</p>' : "") +
                        (link ? '<a href="' + link + '" target="_blank" rel="noopener noreferrer" style="color: #3c35f2; text-decoration: underline; font-weight: 600; font-size: 14px;">Open link →</a>' : "") +
                      '</div>';
                    }).join("")}

                    \${weekly?.what_were_cooking?.title ? '<h2 style="margin: 24px 0 16px; font-size: 16px; font-weight: 700; color: #0d0d0d; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #0d0d0d; padding-bottom: 8px;">What We\\'re Cooking</h2>' +
                      '<div style="padding: 18px 20px; background: #fafafa; border-left: 3px solid #0d0d0d;">' +
                        '<h3 style="margin: 6px 0 10px; color: #0d0d0d; font-size: 18px; font-weight: 700; line-height: 1.4;">' + weekly.what_were_cooking.title + '</h3>' +
                        (weekly.what_were_cooking.description ? '<p style="margin: 0 0 12px; color: #0d0d0d; font-size: 15px; line-height: 1.6;">' + weekly.what_were_cooking.description + '</p>' : "") +
                        (() => {
                          const cookingLink = safeLink([weekly.what_were_cooking.url, weekly.what_were_cooking.link]);
                          return cookingLink
                            ? '<a href="' + cookingLink + '" target="_blank" rel="noopener noreferrer" style="color: #3c35f2; text-decoration: underline; font-weight: 600; font-size: 14px;">Check it out →</a>'
                            : "";
                        })() +
                      '</div>' : ""}
                  </td>
                </tr>
                <tr>
                  <td class="mobile-footer" style="padding: 24px 40px 36px; text-align: center;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px;">
                      <tr>
                        <td style="height: 1px; background: rgba(0, 0, 0, 0.08); font-size: 0; line-height: 0;">&nbsp;</td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; margin: 0 auto;">
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <p style="margin: 0 0 8px; color: rgba(13, 13, 13, 0.5); font-size: 12px; line-height: 1.6;">
                            You are receiving this email because you subscribed to the cucina <strong>labs</strong> Weekly Update.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <a href="\${unsubscribeUrl}" style="color: #3c35f2; text-decoration: underline; font-weight: 600; font-size: 12px;">Unsubscribe</a>
                          <p style="margin: 8px 0 0; color: rgba(13, 13, 13, 0.5); font-size: 11px;">
                            You can unsubscribe at any time by clicking the link above.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 12px; border-top: 1px solid rgba(0, 0, 0, 0.06);">
                          <p style="margin: 0 0 8px; color: rgba(13, 13, 13, 0.5); font-size: 12px; line-height: 1.6;">
                            cucina <strong>labs</strong>
                          </p>
                          <p style="margin: 8px 0 0; color: rgba(13, 13, 13, 0.5); font-size: 11px;">
                            © \${new Date().getFullYear()} cucina labs. All rights reserved.
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

export const normalizeNewsletterArticles = (articles: any[], origin?: string) =>
  (articles || []).map((article) => {
    const sourceLink = article.source_link || article.sourceLink || article.link || ""
    const imageLink = article.image_link || article.imageUrl || article.image_url || ""
    return {
      ...article,
      source_link: origin && sourceLink ? wrapRedirectUrl(sourceLink, origin) : sourceLink,
      image_link: origin && imageLink ? wrapRedirectUrl(imageLink, origin) : imageLink,
      summary: article.summary || article.aiSummary || article.ai_generated_summary || "",
      why_it_matters: article.whyItMatters || article.why_it_matters || "",
      business_value: article.businessValue || article.business_value || "",
    }
  })

const isLikelyUrl = (value?: string): boolean => {
  const normalized = normalizeUrl(value)
  if (!normalized) return false
  try {
    const urlObj = new URL(normalized)
    return Boolean(urlObj.hostname && urlObj.hostname.includes("."))
  } catch {
    return false
  }
}

export const buildNewsletterTemplateContext = ({
  content,
  articles,
  origin,
}: {
  content: any
  articles: any[]
  origin?: string
}) => {
  const normalizeTitle = (value: string) =>
    value
      .toLowerCase()
      .replace(/['’"]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()

  const resolveArticleLink = (article: any) =>
    article?.source_link || article?.sourceLink || article?.link || ""

  const findArticleForStory = (story: any, storyIndex?: number) => {
    if (!story) return null
    if (typeof story === "string") {
      return normalizedArticles.find(
        (article) => article.id === story || article.source_link === story
      )
    }

    const storyId = story.id
    const storyLink = story.link || story.source_link
    const storyTitle = story.headline || story.title
    const normalizedStoryTitle = storyTitle ? normalizeTitle(storyTitle) : ""
    const index =
      typeof story.__index === "number"
        ? story.__index
        : typeof storyIndex === "number"
        ? storyIndex
        : null

    return (
      (storyId
        ? normalizedArticles.find((article) => article.id === storyId)
        : null) ||
      (storyLink
        ? normalizedArticles.find(
            (article) =>
              article.source_link === storyLink || article.link === storyLink
          )
        : null) ||
      (storyTitle
        ? normalizedArticles.find((article) => article.title === storyTitle)
        : null) ||
      (normalizedStoryTitle
        ? normalizedArticles.find(
            (article) =>
              normalizeTitle(article.title || "") === normalizedStoryTitle
          )
        : null) ||
      (index !== null ? normalizedArticles[index] : null) ||
      null
    )
  }

  const featured = content?.featuredStory || content?.featured_story || {}
  const stories = content?.topStories || content?.top_stories || []
  const normalizedArticles = normalizeNewsletterArticles(articles || [], origin)
  const extraWeeklyLinks = [
    ...(Array.isArray(content?.what_were_reading) ? content.what_were_reading : []),
    ...(Array.isArray(content?.whatWereReading) ? content.whatWereReading : []),
  ]
    .map((item: any) => item?.url || item?.link)
    .filter(Boolean)

  const cookingLinkCandidate =
    content?.what_were_cooking?.url ||
    content?.what_were_cooking?.link ||
    content?.whatWereCooking?.url ||
    content?.whatWereCooking?.link

  if (cookingLinkCandidate) {
    extraWeeklyLinks.push(cookingLinkCandidate)
  }

  const allowlist = buildAllowlist([
    ...(articles || []).map((article) => ({
      source_link: article?.source_link,
      link: article?.link,
      url: article?.url,
      guid: isLikelyUrl(article?.guid) ? article?.guid : undefined,
    })),
    ...extraWeeklyLinks.map((url) => ({ url })),
  ])
  const linkDebug = process.env.NEWSLETTER_LINK_DEBUG === "true"
  const featuredArticle = findArticleForStory(featured) || normalizedArticles[0] || {}
  const featuredSource = resolveArticleLink(featuredArticle)
  const featuredLink = featured?.link || featured?.source_link || featuredSource

  const newsletter = {
    subject: content?.subject || "cucina labs Briefing",
    intro: content?.intro || "",
    featured_story: {
      id: featured?.id,
      headline: featured?.title || featured?.headline || "",
      why_this_matters: featured?.summary || featured?.why_this_matters || "",
      link: featuredLink
        ? wrapRedirectUrl(featuredLink, origin || "")
        : "",
      source_link: featuredSource
        ? wrapRedirectUrl(featuredSource, origin || "")
        : "",
    },
    top_stories: (stories || []).map((story: any, index: number) => ({
      __index: index,
      ...(() => {
        const matched = findArticleForStory(story, index)
        const sourceLink = resolveArticleLink(matched)
        const storyLink = story?.link || story?.source_link || sourceLink
        return {
          link: storyLink ? wrapRedirectUrl(storyLink, origin || "") : "",
          source_link: sourceLink ? wrapRedirectUrl(sourceLink, origin || "") : "",
          category: story?.category || matched?.category || "",
          creator: story?.creator || matched?.creator || "",
        }
      })(),
      id: story?.id,
      headline: story?.title || story?.headline || "",
      why_read_it: story?.summary || story?.why_read_it || "",
    })),
    looking_ahead: content?.lookingAhead || content?.looking_ahead || "",
  }

  const weeklyFromChefsTable = content?.from_chefs_table || content?.fromChefsTable || {}
  const weeklyNews = Array.isArray(content?.news)
    ? content.news
    : Array.isArray(content?.weeklyNews)
    ? content.weeklyNews
    : []
  const weeklyReading = Array.isArray(content?.what_were_reading)
    ? content.what_were_reading
    : Array.isArray(content?.whatWereReading)
    ? content.whatWereReading
    : Array.isArray(content?.recipes)
    ? content.recipes
    : []
  const weeklyCooking = content?.what_were_cooking || content?.whatWereCooking || {}

  const weekly = {
    from_chefs_table: {
      title: weeklyFromChefsTable?.title || "",
      body: weeklyFromChefsTable?.body || newsletter.intro || "",
    },
    news: (weeklyNews.length ? weeklyNews : newsletter.top_stories).map((story: any) => ({
      id: story?.id,
      headline: story?.headline || story?.title || "",
      why_this_matters: story?.why_this_matters || story?.summary || story?.why_read_it || "",
      source: story?.source || story?.creator || "",
      link:
        story?.link || story?.source_link
          ? wrapRedirectUrl(story?.link || story?.source_link, origin || "")
          : "",
    })),
    what_were_reading: weeklyReading.map((item: any) => ({
      title: item?.title || "",
      url:
        item?.url || item?.link
          ? wrapRedirectUrl(item?.url || item?.link, origin || "")
          : "",
      description: item?.description || item?.summary || "",
    })),
    what_were_cooking: {
      title: weeklyCooking?.title || "",
      url:
        weeklyCooking?.url || weeklyCooking?.link
          ? wrapRedirectUrl(weeklyCooking?.url || weeklyCooking?.link, origin || "")
          : "",
      description: weeklyCooking?.description || newsletter.looking_ahead || "",
    },
  }

  const findArticle = (story: any) => findArticleForStory(story)

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  const baseUrl = origin || ""
  const unsubscribeUrl = baseUrl ? normalizeUrl(`${baseUrl}/unsubscribe`) : "/unsubscribe"
  const bannerUrl = `${baseUrl}/video-background-2-still.png`

  return {
    content,
    newsletter,
    weekly,
    articles: normalizedArticles,
    featured: featuredArticle,
    formatDate,
    findArticle,
    unsubscribeUrl,
    bannerUrl,
    safeLink: (candidates: Array<string | undefined | null>) =>
      safeLink(candidates, allowlist, linkDebug),
    currentDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  }
}

// Register Handlebars helper for date formatting
Handlebars.registerHelper('formatDate', function(date: Date) {
  if (!date || !(date instanceof Date)) {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
})

// Register Handlebars helper for default values
Handlebars.registerHelper('or', function(...args) {
  // Last argument is Handlebars options, so exclude it
  const values = args.slice(0, -1)
  return values.find(v => v != null && v !== '') || ''
})

Handlebars.registerHelper('inc', function(value: number) {
  return Number(value || 0) + 1
})

export const renderNewsletterTemplate = (template: string, context: Record<string, any>) => {
  try {
    // Backward compatibility: existing saved templates use JS template-literal syntax.
    // Render those first, and keep Handlebars for newer templates.
    if (template.includes("${")) {
      const keys = Object.keys(context)
      const values = Object.values(context)
      const escapedTemplate = template.replace(/`/g, "\\`")
      const evaluateTemplate = new Function(
        ...keys,
        `"use strict"; return \`${escapedTemplate}\`;`
      ) as (...args: any[]) => string
      return evaluateTemplate(...values)
    }

    const compiled = Handlebars.compile(template)
    return compiled(context)
  } catch (error) {
    console.error('Template rendering error:', error)
    throw new Error('Failed to render newsletter template')
  }
}

export const DEFAULT_WELCOME_TEMPLATE = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Welcome to cucina labs!</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }

    /* iOS blue links */
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }

    /* Gmail blue links */
    u + #body a {
      color: inherit;
      text-decoration: none;
      font-size: inherit;
      font-family: inherit;
      font-weight: inherit;
      line-height: inherit;
    }

    /* Prevent Outlook.com from adding extra spacing */
    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
      line-height: 100%;
    }

    /* What it does: Centers email on Android 4.4 */
    div[style*="margin: 16px 0"] { margin: 0 !important; }

    /* Mobile responsive */
    @media only screen and (max-width: 600px) {
      .mobile-wrapper { padding: 12px 0 !important; }
      .mobile-content { padding: 24px 16px !important; }
      .mobile-header { padding: 24px 16px !important; }
      .mobile-footer { padding: 20px 16px 28px !important; }
      .mobile-card { border-radius: 0 !important; }
      .mobile-heading { font-size: 28px !important; }
      .mobile-text { font-size: 16px !important; }
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
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="mobile-card" style="background: #ffffff; border: 1px solid rgba(0, 0, 0, 0.06); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); overflow: hidden;">

                <!-- HEADER -->
                <tr>
                  <td bgcolor="#0d0d0d" class="mobile-header" style="padding: 32px 40px; background-color: #0d0d0d;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="left">
                          <h1 style="margin: 0 0 4px; font-size: 48px; font-weight: 400; color: #ffffff; line-height: 1.1; letter-spacing: -0.02em;">cucina <strong style="font-weight: 700;">labs</strong></h1>
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: rgba(255, 255, 255, 0.7); text-transform: uppercase; letter-spacing: 0.15em;">Welcome</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- MAIN CONTENT -->
                <tr>
                  <td class="mobile-content" style="padding: 40px 40px;">

                    <p style="margin: 0 0 20px; font-size: 17px; color: #0d0d0d; line-height: 1.6; font-weight: 600;">Welcome Chef!</p>

                    <p style="margin: 0 0 24px; font-size: 15px; color: #0d0d0d; line-height: 1.6;">Thanks for subscribing to the <strong>cucina labs</strong> newsletter. You've just joined a community of AI builders and product leaders who want to stay ahead of the curve.</p>

                    <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #0d0d0d; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #0d0d0d; padding-bottom: 8px;">What's on the menu</h2>

                    <p style="margin: 0 0 16px; font-size: 15px; color: #0d0d0d; line-height: 1.6;"><strong>Daily AI News & Insights:</strong> Every day, we serve up a curated list of the latest developments and updates in artificial intelligence. We cut through the noise and highlight what matters.</p>

                    <p style="margin: 0 0 24px; font-size: 15px; color: #0d0d0d; line-height: 1.6; border-bottom: 2px solid #0d0d0d; padding-bottom: 24px;"><strong>Weekly Updates:</strong> Once a week, we showcase our experiments and projects. We'll share prototypes and recipes that will help you build cool things with AI.</p>

                    <p style="margin: 0 0 16px; font-size: 15px; color: #0d0d0d; line-height: 1.6;">Your first briefing arrives tomorrow morning. We're thrilled to have you in the kitchen with us.</p>

                    <p style="margin: 0 0 8px; font-size: 15px; color: #0d0d0d; line-height: 1.6; font-weight: 700;">Let's cook.</p>

                    <p style="margin: 0; font-size: 15px; color: #0d0d0d; line-height: 1.6;">the <strong>cucina labs</strong> team</p>

                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td class="mobile-footer" style="padding: 24px 40px 36px; text-align: center;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px;">
                      <tr>
                        <td style="height: 1px; background: rgba(0, 0, 0, 0.08); font-size: 0; line-height: 0;">&nbsp;</td>
                      </tr>
                    </table>
                    <p style="margin: 0 0 10px; color: rgba(13, 13, 13, 0.5); font-size: 12px;">You are receiving this because you subscribed to <strong>cucina labs</strong>.</p>
                    <a href="#" style="color: #3c35f2; text-decoration: underline; font-weight: 600; font-size: 12px;">Unsubscribe</a>
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
