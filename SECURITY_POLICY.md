# Security & Compliance Policy
## cucina labs - Code Review Checklist

**Last Updated:** January 2026
**Version:** 1.0

---

## Purpose

This document outlines the security and compliance standards that MUST be verified before committing any new code to the cucina labs repository. All developers and AI agents must check code against these criteria before creating commits or pull requests.

---

## Pre-Commit Checklist

Before committing ANY code, verify the following:

### ✅ 1. Input Validation & Sanitization

**Check:**
- [ ] All user inputs are validated using Zod schemas or equivalent
- [ ] Email addresses validated with proper regex/Zod email validator
- [ ] No raw user input is directly interpolated into HTML, SQL, or shell commands
- [ ] File uploads (if any) have proper type and size validation

**Anti-patterns to avoid:**
```typescript
// ❌ BAD - No validation
const { email } = await request.json()

// ✅ GOOD - Zod validation
const schema = z.object({ email: z.string().email() })
const { email } = schema.parse(await request.json())
```

---

### ✅ 2. Template & Code Injection Prevention

**Check:**
- [ ] NEVER use `new Function()`, `eval()`, or `Function()` constructor
- [ ] Template engines (Handlebars) used with `noEscape: false` for HTML escaping
- [ ] No dynamic code execution based on user input
- [ ] No `dangerouslySetInnerHTML` in React components without proper sanitization

**Anti-patterns to avoid:**
```typescript
// ❌ BAD - Template injection vulnerability
const render = new Function('data', `return \`${template}\``)

// ✅ GOOD - Safe template engine
const compiled = Handlebars.compile(template, { noEscape: false })
```

---

### ✅ 3. SQL Injection Prevention

**Check:**
- [ ] All database queries use Prisma ORM with parameterized queries
- [ ] NO raw SQL queries unless absolutely necessary
- [ ] If raw SQL required, use parameterized queries (`$1`, `$2`, etc.)
- [ ] No string concatenation in SQL queries

**Anti-patterns to avoid:**
```typescript
// ❌ BAD - SQL injection risk
await prisma.$executeRaw(`SELECT * FROM users WHERE email = '${email}'`)

// ✅ GOOD - Parameterized query
await prisma.user.findUnique({ where: { email } })
```

---

### ✅ 4. XSS (Cross-Site Scripting) Prevention

**Check:**
- [ ] No `innerHTML` usage in client-side code
- [ ] No `dangerouslySetInnerHTML` without DOMPurify or similar sanitization
- [ ] React components use JSX (automatic escaping)
- [ ] Email templates escape HTML by default (Handlebars `noEscape: false`)

**Anti-patterns to avoid:**
```typescript
// ❌ BAD - XSS vulnerability
element.innerHTML = userContent

// ✅ GOOD - React automatic escaping
<div>{userContent}</div>
```

---

### ✅ 5. Open Redirect Prevention

**Check:**
- [ ] All redirect URLs validated against allowlist
- [ ] Only HTTPS/HTTP protocols allowed (no `javascript:`, `data:`, `file:`)
- [ ] No unvalidated user-controlled redirects
- [ ] Subdomain validation included in allowlist check

**Anti-patterns to avoid:**
```typescript
// ❌ BAD - Open redirect vulnerability
return NextResponse.redirect(request.nextUrl.searchParams.get('url'))

// ✅ GOOD - Validate against allowlist
if (!isAllowedDomain(urlObj.hostname)) {
  return NextResponse.json({ error: "Not allowed" }, { status: 403 })
}
return NextResponse.redirect(validatedUrl)
```

---

### ✅ 6. Authentication & Authorization

**Check:**
- [ ] All admin routes protected by NextAuth middleware
- [ ] Session validation on protected API endpoints
- [ ] No authentication bypass vulnerabilities
- [ ] Passwords hashed with bcrypt (min 10 rounds)
- [ ] JWT sessions have reasonable expiration (7 days max)

**Required for protected endpoints:**
```typescript
// ✅ Session check required
const session = await getServerSession(authOptions)
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

---

### ✅ 7. Encryption & Secrets Management

**Check:**
- [ ] All encryption uses random salts (never hardcoded)
- [ ] AES-256-GCM or stronger for encryption
- [ ] Scrypt/Argon2 for key derivation with strong parameters
- [ ] No secrets hardcoded in source code
- [ ] All secrets loaded from environment variables
- [ ] `.env` files in `.gitignore`

**Required standards:**
```typescript
// ✅ Random salt per encryption
const salt = crypto.randomBytes(32)
const key = crypto.scryptSync(masterKey, salt, 32, { N: 16384, r: 8, p: 1 })
```

---

### ✅ 8. HMAC & Token Security

**Check:**
- [ ] HMAC tokens include expiration timestamp
- [ ] Email addresses normalized (lowercase, trimmed) before hashing
- [ ] Token payload includes timestamp for expiration validation
- [ ] Backward compatibility maintained for old tokens (if applicable)
- [ ] Use dedicated secret (not shared with other systems)

**Required format:**
```typescript
// ✅ Token with expiration
const normalizedEmail = email.trim().toLowerCase()
const timestamp = Math.floor((Date.now() + expirationMs) / 1000)
const payload = `${normalizedEmail}:${timestamp}`
const token = crypto.createHmac('sha256', secret).update(payload).digest('hex')
```

---

### ✅ 9. Rate Limiting

**Check:**
- [ ] All public endpoints have rate limiting
- [ ] Signup/subscribe: 5 requests per 15 minutes (STRICT)
- [ ] Auth endpoints: 10 requests per 15 minutes (MODERATE)
- [ ] General APIs: 30 requests per minute (STANDARD)
- [ ] Read-only: 100 requests per minute (LENIENT)
- [ ] Rate limiter returns 429 with Retry-After header

**Required implementation:**
```typescript
// ✅ Apply rate limiting
const rateLimitResponse = rateLimit(request, RateLimitPresets.STRICT, "endpoint-name")
if (rateLimitResponse) return rateLimitResponse
```

---

### ✅ 10. CAN-SPAM Compliance (Email)

**Check:**
- [ ] ALL emails include CAN-SPAM footer (automatically appended)
- [ ] Use `appendEmailFooter()` utility for all marketing emails
- [ ] Prominent unsubscribe link in all marketing emails
- [ ] Physical business address included in footer
- [ ] Clear identification of sender
- [ ] Unsubscribe processed within 10 business days
- [ ] No misleading subject lines or headers

**Required implementation:**
```typescript
// ✅ ALWAYS append CAN-SPAM footer to marketing emails
import { appendEmailFooter } from "@/lib/email-footer"

const htmlWithFooter = appendEmailFooter(emailTemplate.html, {
  email: subscriberEmail,
  includeUnsubscribe: true,
  origin: process.env.NEXTAUTH_URL,
})

await resend.emails.send({
  to: subscriberEmail,
  subject: "Your Subject",
  html: htmlWithFooter,
})
```

**Footer includes:**
- ✅ Unsubscribe button/link with HMAC token
- ✅ Business address (from env vars)
- ✅ Company name clearly displayed
- ✅ Copyright notice

**CRITICAL:** The newsletter template (`lib/newsletter-template.ts`) already includes the footer. The `appendEmailFooter()` utility is for OTHER emails (welcome, transactional, etc.).

---

### ✅ 11. CSRF Protection

**Check:**
- [ ] NextAuth CSRF protection enabled for authenticated routes
- [ ] No state-changing GET requests
- [ ] All mutations use POST/PUT/DELETE with proper validation
- [ ] SameSite cookie attribute set appropriately

**Anti-patterns to avoid:**
```typescript
// ❌ BAD - State change via GET
export async function GET(request) {
  await prisma.user.delete({ where: { id } })
}

// ✅ GOOD - State change via POST
export async function POST(request) {
  const session = await getServerSession()
  if (!session) return unauthorized()
  await prisma.user.delete({ where: { id } })
}
```

---

### ✅ 12. Error Handling & Information Disclosure

**Check:**
- [ ] No stack traces exposed to clients
- [ ] Generic error messages for users
- [ ] Detailed errors only in server logs
- [ ] No sensitive data in error responses
- [ ] No database schema information leaked

**Anti-patterns to avoid:**
```typescript
// ❌ BAD - Exposes implementation details
catch (error) {
  return NextResponse.json({ error: error.message, stack: error.stack })
}

// ✅ GOOD - Generic message, log details
catch (error) {
  console.error('Operation failed:', error)
  return NextResponse.json({ error: 'Operation failed. Please try again.' })
}
```

---

### ✅ 13. Dependency Security

**Check:**
- [ ] Run `npm audit` before committing
- [ ] No HIGH or CRITICAL vulnerabilities in production dependencies
- [ ] Dev dependency vulnerabilities documented (acceptable)
- [ ] Dependencies kept reasonably up-to-date

**Required check:**
```bash
# Run before every commit
npm audit --production
```

---

### ✅ 14. API Endpoint Security

**Check:**
- [ ] CORS properly configured (default Next.js restrictive settings)
- [ ] Request size limits enforced
- [ ] Timeout limits set for long-running operations
- [ ] No excessive data returned in responses
- [ ] Pagination implemented for large datasets

---

### ✅ 15. Client-Side Security

**Check:**
- [ ] No sensitive data in localStorage or sessionStorage
- [ ] No API keys or secrets in client-side code
- [ ] Proper HTTPS enforcement in production
- [ ] Content Security Policy headers configured
- [ ] No sensitive data in URL parameters (use POST body)

---

## Security Incident Response

If a security vulnerability is discovered:

1. **DO NOT commit the vulnerable code**
2. **Document the issue** with file location and line numbers
3. **Create a fix** following this security policy
4. **Test the fix** thoroughly
5. **Review the fix** against all checklist items
6. **Document the fix** in commit message

---

## Commit Message Format for Security Fixes

Use this format for security-related commits:

```
Security: Fix [vulnerability type] in [component]

- Issue: [Brief description of vulnerability]
- Impact: [Severity and potential damage]
- Fix: [What was changed]
- Files: [List of modified files]

Fixes #[issue-number] (if applicable)
```

**Example:**
```
Security: Fix open redirect vulnerability in redirect API

- Issue: Unvalidated URL redirects could be used for phishing
- Impact: HIGH - Domain reputation damage, user trust
- Fix: Implemented domain allowlist with 15+ trusted sources
- Files: app/api/redirect/route.ts

- Added ALLOWED_DOMAINS configuration
- Added isAllowedDomain() validation function
- Block non-HTTP(S) protocols
- Return 403 for unauthorized domains
```

---

## Regular Security Audits

**Required frequency:**
- [ ] **Weekly**: Run `npm audit` and review dependencies
- [ ] **Before major releases**: Full security audit using this checklist
- [ ] **After new features**: Security review of new code
- [ ] **Quarterly**: Review and update this security policy

---

## Testing Requirements

Before committing security-sensitive code:

- [ ] Unit tests for validation logic
- [ ] Integration tests for authentication flows
- [ ] Manual testing of rate limiting
- [ ] Test error handling edge cases
- [ ] Verify backward compatibility (if applicable)

---

## Tools & Resources

**Recommended security tools:**
- `npm audit` - Dependency vulnerability scanning
- ESLint security plugins - Static analysis
- Prisma - SQL injection prevention (parameterized queries)
- Zod - Input validation
- NextAuth - Authentication framework
- Handlebars - Safe templating

**Security references:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NextJS Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

---

## Compliance Requirements

### CAN-SPAM Act (Email Marketing)
- [ ] Unsubscribe link in every email
- [ ] Physical business address
- [ ] Clear sender identification
- [ ] Honor unsubscribe within 10 days
- [ ] Accurate subject lines

### GDPR (EU Users)
- [ ] User consent for data collection
- [ ] Right to data deletion (unsubscribe)
- [ ] Data encryption at rest
- [ ] Privacy policy accessible

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial security policy created after comprehensive security audit |

---

## Approval

This security policy must be reviewed and followed by all contributors to the cucina labs codebase.

**Last Reviewed By:** Security Audit (Claude Sonnet 4.5)
**Date:** January 11, 2026
**Status:** Active
