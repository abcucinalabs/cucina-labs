# Pre-Commit Security Checklist

**Quick reference - Check ALL items before committing code**

---

## 🔒 Core Security (CRITICAL)

- [ ] No `new Function()`, `eval()`, or dynamic code execution
- [ ] No hardcoded secrets, API keys, or passwords
- [ ] All secrets loaded from environment variables
- [ ] Input validation with Zod on all user inputs
- [ ] Email addresses validated with `.email()` validator

---

## 🛡️ Injection Prevention

- [ ] Database queries use Prisma ORM (parameterized)
- [ ] Template engines use safe mode (Handlebars with `noEscape: false`)
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] No string interpolation in SQL, shell commands, or HTML

---

## 🔐 Authentication & Authorization

- [ ] Protected routes check session: `await getServerSession()`
- [ ] Return 401 for unauthorized requests
- [ ] Passwords hashed with bcrypt (10+ rounds)
- [ ] JWT sessions expire within 7 days

---

## 🚦 Rate Limiting

- [ ] Public endpoints have rate limiting applied
- [ ] Signup/subscribe: STRICT (5 per 15min)
- [ ] Auth endpoints: MODERATE (10 per 15min)
- [ ] Redirects: LENIENT (100 per min)

---

## 🔑 Encryption & Tokens

- [ ] Random salts for all encryption (32 bytes)
- [ ] HMAC tokens include expiration timestamp
- [ ] Email normalized before hashing: `.trim().toLowerCase()`
- [ ] Strong scrypt params: `N: 16384, r: 8, p: 1`

---

## 🌐 Web Security

- [ ] Redirect URLs validated against allowlist
- [ ] Only HTTPS/HTTP protocols (no `javascript:`, `data:`)
- [ ] CORS properly configured
- [ ] No stack traces exposed to clients
- [ ] Generic error messages for users

---

## 📧 CAN-SPAM Compliance (Email)

- [ ] **ALL emails** use `appendEmailFooter()` utility
- [ ] Unsubscribe link in all marketing emails (auto-added)
- [ ] Business address in email footer (auto-added)
- [ ] Clear sender identification
- [ ] Unsubscribe works correctly

**Code check:**
```typescript
import { appendEmailFooter } from "@/lib/email-footer"
const html = appendEmailFooter(template, { email, includeUnsubscribe: true })
```

---

## 🧪 Testing

- [ ] Run `npm audit --production` (no HIGH/CRITICAL)
- [ ] Test validation with invalid inputs
- [ ] Test rate limiting works
- [ ] Test error handling

---

## 📝 Documentation

- [ ] Security-related changes documented in commit message
- [ ] Use format: `Security: Fix [type] in [component]`
- [ ] Update SECURITY_POLICY.md if adding new patterns

---

**Last Updated:** January 2026
