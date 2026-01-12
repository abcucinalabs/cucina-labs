# Email Footer Utility - CAN-SPAM Compliance

## Overview

The `email-footer.ts` utility ensures **ALL marketing emails** sent from cucina labs include a CAN-SPAM compliant footer. This is a **legal requirement** under the CAN-SPAM Act.

## Why This Matters

**Legal Compliance:** The CAN-SPAM Act requires ALL commercial emails to include:
1. ✅ A clear and conspicuous way to unsubscribe
2. ✅ Your physical mailing address
3. ✅ Clear identification of who is sending the email

**Penalties:** Violations can result in fines up to **$50,120 per email**.

## When to Use

### ✅ MUST Use for These Emails:
- Welcome emails (already implemented in `app/api/subscribe/route.ts`)
- Transactional emails with marketing content
- Promotional announcements
- Any email to subscribers

### ❌ Newsletter Emails:
The main newsletter template (`lib/newsletter-template.ts`) **already includes** a hardcoded CAN-SPAM footer. You do NOT need to use this utility for newsletter emails.

### ❌ Pure Transactional Emails:
Purely transactional emails (password resets, order confirmations without marketing) may not require unsubscribe links, but it's good practice to include the business address.

## Usage

### Basic Usage (With Unsubscribe):

```typescript
import { appendEmailFooter } from "@/lib/email-footer"

// Your email HTML template
const emailHtml = `
  <html>
    <body>
      <h1>Welcome to cucina labs!</h1>
      <p>Thanks for subscribing.</p>
    </body>
  </html>
`

// Append CAN-SPAM footer
const htmlWithFooter = appendEmailFooter(emailHtml, {
  email: "user@example.com",
  includeUnsubscribe: true,
  origin: process.env.NEXTAUTH_URL,
})

// Send email
await resend.emails.send({
  from: "cucina labs <newsletter@cucinalabs.com>",
  to: "user@example.com",
  subject: "Welcome!",
  html: htmlWithFooter,
})
```

### Without Unsubscribe (Transactional Only):

```typescript
const htmlWithFooter = appendEmailFooter(emailHtml, {
  email: "user@example.com",
  includeUnsubscribe: false, // No unsubscribe link
  origin: process.env.NEXTAUTH_URL,
})
```

## How It Works

### Automatic Footer Insertion

The utility automatically detects where to insert the footer:
1. Before `</body>` tag (preferred)
2. Before `</html>` tag (fallback)
3. At the end of the HTML (last resort)

### Token Generation

The unsubscribe link includes a secure HMAC token with:
- Normalized email (lowercase, trimmed)
- Expiration timestamp (90 days)
- HMAC signature using `UNSUBSCRIBE_SECRET` or `NEXTAUTH_SECRET`

### Business Address

Footer includes business address from environment variables:
- `BUSINESS_ADDRESS` - Street address
- `BUSINESS_CITY` - City
- `BUSINESS_STATE` - State
- `BUSINESS_ZIP` - ZIP code

## API Reference

### `appendEmailFooter(html, options)`

Appends a CAN-SPAM compliant footer to HTML email.

**Parameters:**
- `html` (string): Original email HTML
- `options` (object):
  - `email` (string): Recipient email address (required)
  - `includeUnsubscribe` (boolean): Include unsubscribe link (default: true)
  - `origin` (string): Base URL for unsubscribe link (optional)

**Returns:** HTML string with footer appended

### `generateEmailFooter(options)`

Generates only the footer HTML (for advanced use cases).

**Parameters:**
- Same as `appendEmailFooter`

**Returns:** Footer HTML string

### `validateEmailCompliance(html)`

Validates that an email has required CAN-SPAM elements.

**Parameters:**
- `html` (string): Email HTML to validate

**Returns:** Array of missing elements (empty array if compliant)

**Example:**
```typescript
import { validateEmailCompliance } from "@/lib/email-footer"

const missing = validateEmailCompliance(myEmailHtml)
if (missing.length > 0) {
  console.error("Email missing:", missing)
  // ["Unsubscribe link", "Physical business address"]
}
```

## Footer Contents

The generated footer includes:

```html
<!-- CAN-SPAM Compliant Footer (Auto-Generated) -->
<table>
  <tr>
    <td>You are receiving this email because you subscribed to cucina labs.</td>
  </tr>
  <tr>
    <td>
      <a href="[unsubscribe-link]">Unsubscribe</a>
      <p>You can unsubscribe at any time by clicking the link above.</p>
    </td>
  </tr>
  <tr>
    <td>
      cucina labs<br>
      123 Main Street<br>
      San Francisco, CA 94102<br>
      © 2026 cucina labs. All rights reserved.
    </td>
  </tr>
</table>
```

## Environment Variables Required

Add these to your `.env` file:

```bash
# CAN-SPAM Business Address (REQUIRED)
BUSINESS_ADDRESS="Your Street Address"
BUSINESS_CITY="Your City"
BUSINESS_STATE="Your State"
BUSINESS_ZIP="Your ZIP Code"

# Optional: Dedicated unsubscribe secret (recommended)
UNSUBSCRIBE_SECRET="your-random-secret-string"

# Base URL for unsubscribe links
NEXTAUTH_URL="https://yourdomain.com"
```

## Security Features

### Token Security:
- ✅ HMAC-SHA256 signature
- ✅ 90-day expiration
- ✅ Email normalization (prevents case bypass)
- ✅ Timestamp included in payload

### Validation:
- ✅ Expired tokens rejected
- ✅ Invalid signatures rejected
- ✅ Email normalization ensures consistency

## Examples

### Example 1: Welcome Email

```typescript
// In app/api/subscribe/route.ts
import { appendEmailFooter } from "@/lib/email-footer"

const welcomeHtml = `
  <h1>Welcome to the kitchen!</h1>
  <p>You're now subscribed to our AI Product Briefing.</p>
`

const htmlWithFooter = appendEmailFooter(welcomeHtml, {
  email: subscriberEmail,
  includeUnsubscribe: true,
  origin: process.env.NEXTAUTH_URL,
})

await resend.emails.send({
  to: subscriberEmail,
  subject: "Welcome to cucina labs",
  html: htmlWithFooter,
})
```

### Example 2: Promotional Email

```typescript
const promoHtml = `
  <h1>Special Offer: Premium Access</h1>
  <p>Get 50% off our premium features.</p>
`

const htmlWithFooter = appendEmailFooter(promoHtml, {
  email: userEmail,
  includeUnsubscribe: true,
})
```

### Example 3: Validation Before Sending

```typescript
import { validateEmailCompliance, appendEmailFooter } from "@/lib/email-footer"

let finalHtml = customEmailTemplate

// Check if already compliant
const missing = validateEmailCompliance(finalHtml)

if (missing.length > 0) {
  console.log("Adding footer for compliance:", missing)
  finalHtml = appendEmailFooter(finalHtml, {
    email: recipientEmail,
    includeUnsubscribe: true,
  })
}

await sendEmail(finalHtml)
```

## Testing

### Test Footer Generation:

```typescript
import { generateEmailFooter } from "@/lib/email-footer"

const footer = generateEmailFooter({
  email: "test@example.com",
  includeUnsubscribe: true,
  origin: "http://localhost:3000",
})

console.log(footer)
```

### Test Compliance Validation:

```typescript
import { validateEmailCompliance } from "@/lib/email-footer"

// Missing everything
const bad = "<html><body>Hello</body></html>"
console.log(validateEmailCompliance(bad))
// ["Unsubscribe link", "Physical business address", "Sender identification"]

// Compliant
const good = appendEmailFooter(bad, { email: "test@example.com" })
console.log(validateEmailCompliance(good))
// []
```

## Troubleshooting

### Footer Not Appearing?

**Check:**
1. HTML has proper closing tags (`</body>` or `</html>`)
2. Environment variables are set (`BUSINESS_ADDRESS`, etc.)
3. Function is actually called before sending email

### Unsubscribe Link Not Working?

**Check:**
1. `NEXTAUTH_URL` environment variable is set correctly
2. `NEXTAUTH_SECRET` or `UNSUBSCRIBE_SECRET` is configured
3. Token hasn't expired (90 days)
4. Email matches exactly (case-insensitive)

### Placeholder Address Showing?

**Set environment variables:**
```bash
BUSINESS_ADDRESS="123 Your Street"
BUSINESS_CITY="Your City"
BUSINESS_STATE="CA"
BUSINESS_ZIP="12345"
```

## Best Practices

1. **Always use for marketing emails** - Even if it seems like overkill
2. **Set real business address** - Don't use placeholder values in production
3. **Test unsubscribe flow** - Verify tokens work before sending to real users
4. **Log footer additions** - Track which emails get footers for debugging
5. **Validate before sending** - Use `validateEmailCompliance()` to catch issues

## Related Files

- `lib/email-footer.ts` - Main utility
- `app/api/subscribe/route.ts` - Usage example (welcome email)
- `lib/newsletter-template.ts` - Newsletter with hardcoded footer
- `app/api/unsubscribe/route.ts` - Token verification
- `SECURITY_POLICY.md` - Security requirements

## Support

For issues or questions:
1. Check environment variables are set
2. Review examples in this README
3. Check `SECURITY_POLICY.md` for compliance requirements
4. Review CAN-SPAM Act requirements: https://www.ftc.gov/tips-advice/business-center/guidance/can-spam-act-compliance-guide-business
