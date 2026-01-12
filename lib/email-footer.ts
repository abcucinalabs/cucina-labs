/**
 * CAN-SPAM Compliant Email Footer Utility
 *
 * This module ensures ALL emails sent from the application include
 * a CAN-SPAM compliant footer with:
 * - Unsubscribe link
 * - Physical business address
 * - Clear sender identification
 *
 * IMPORTANT: This footer MUST be appended to all marketing emails
 * to comply with the CAN-SPAM Act.
 */

import crypto from "crypto"

interface FooterOptions {
  email: string
  includeUnsubscribe?: boolean
  origin?: string
}

/**
 * Generates a CAN-SPAM compliant footer for emails
 *
 * @param options - Footer configuration
 * @returns HTML footer string
 */
export function generateEmailFooter(options: FooterOptions): string {
  const { email, includeUnsubscribe = true, origin } = options

  const currentYear = new Date().getFullYear()
  const businessAddress = process.env.BUSINESS_ADDRESS || "123 Main Street"
  const businessCity = process.env.BUSINESS_CITY || "San Francisco"
  const businessState = process.env.BUSINESS_STATE || "CA"
  const businessZip = process.env.BUSINESS_ZIP || "94102"

  let unsubscribeSection = ""

  if (includeUnsubscribe) {
    // Generate unsubscribe token with expiration (90 days)
    const normalizedEmail = email.trim().toLowerCase()
    const expirationDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    const timestamp = Math.floor(expirationDate.getTime() / 1000)
    const secret = process.env.UNSUBSCRIBE_SECRET || process.env.NEXTAUTH_SECRET || ""
    const payload = `${normalizedEmail}:${timestamp}`
    const token = crypto.createHmac("sha256", secret).update(payload).digest("hex")

    const baseUrl = origin || process.env.NEXTAUTH_URL || ""
    const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}&exp=${timestamp}`

    unsubscribeSection = `
      <tr>
        <td style="padding-bottom: 16px;">
          <a href="${unsubscribeUrl}" style="display: inline-block; color: #ffffff; background-color: #3c35f2; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 24px; border-radius: 8px; margin-bottom: 8px;">Unsubscribe</a>
          <p style="margin: 8px 0 0; color: rgba(13, 13, 13, 0.5); font-size: 11px;">
            You can unsubscribe at any time by clicking the link above.
          </p>
        </td>
      </tr>`
  }

  return `
    <!-- CAN-SPAM Compliant Footer (Auto-Generated) -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 40px; border-top: 1px solid rgba(0, 0, 0, 0.06);">
      <tr>
        <td style="padding: 24px 0; text-align: center;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; margin: 0 auto;">
            <tr>
              <td style="padding-bottom: 16px;">
                <p style="margin: 0 0 8px; color: rgba(13, 13, 13, 0.6); font-size: 13px; line-height: 1.6;">
                  You are receiving this email because you subscribed to <strong>cucina labs</strong>.
                </p>
              </td>
            </tr>
            ${unsubscribeSection}
            <tr>
              <td style="padding-top: 12px; border-top: 1px solid rgba(0, 0, 0, 0.06);">
                <p style="margin: 0 0 8px; color: rgba(13, 13, 13, 0.6); font-size: 12px; line-height: 1.6;">
                  <strong>cucina labs</strong><br>
                  ${businessAddress}<br>
                  ${businessCity}, ${businessState} ${businessZip}
                </p>
                <p style="margin: 8px 0 0; color: rgba(13, 13, 13, 0.5); font-size: 11px;">
                  © ${currentYear} cucina labs. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `.trim()
}

/**
 * Appends CAN-SPAM footer to an HTML email
 * Automatically detects and inserts before closing </body> tag
 * Falls back to appending at the end if no </body> tag found
 *
 * @param html - Original email HTML
 * @param options - Footer configuration
 * @returns HTML with footer appended
 */
export function appendEmailFooter(html: string, options: FooterOptions): string {
  const footer = generateEmailFooter(options)

  // Try to insert before closing </body> tag
  if (html.toLowerCase().includes("</body>")) {
    return html.replace(/<\/body>/i, `${footer}\n</body>`)
  }

  // Try to insert before closing </html> tag
  if (html.toLowerCase().includes("</html>")) {
    return html.replace(/<\/html>/i, `${footer}\n</html>`)
  }

  // Fallback: append to end
  return html + footer
}

/**
 * Validates that an email has required CAN-SPAM elements
 * Returns array of missing elements
 *
 * @param html - Email HTML to validate
 * @returns Array of missing elements (empty if valid)
 */
export function validateEmailCompliance(html: string): string[] {
  const missing: string[] = []
  const lowerHtml = html.toLowerCase()

  // Check for unsubscribe link
  if (!lowerHtml.includes("unsubscribe")) {
    missing.push("Unsubscribe link")
  }

  // Check for physical address indicators
  const hasAddress =
    lowerHtml.includes("street") ||
    lowerHtml.includes("address") ||
    /\d{5}(-\d{4})?/.test(html) // ZIP code pattern

  if (!hasAddress) {
    missing.push("Physical business address")
  }

  // Check for sender identification
  if (!lowerHtml.includes("cucina")) {
    missing.push("Sender identification")
  }

  return missing
}
