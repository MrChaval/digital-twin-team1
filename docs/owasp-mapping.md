# OWASP Top 10 Security Controls Mapping
**Project:** Protagon Defense — Digital Twin III  
**Date:** 19 February 2026  
**Auth Provider:** Clerk (handles MFA, sessions, password hashing)  
**WAF:** Arcjet (shield, bot detection, token bucket rate limiting) via `proxy.ts`

---

## A01 — Broken Access Control
**Controls:** Clerk middleware enforces authentication on protected routes (`/admin`, `/resources`, `/projects`) via `createRouteMatcher` in `proxy.ts`. Admin page calls `await isAdmin()` to verify DB role before rendering. Drizzle ORM scopes all DB queries — no direct object references.  
**Status: ✅ Satisfied**

---

## A02 — Cryptographic Failures
**Controls:**  
- Clerk handles password hashing (bcrypt), session tokens, and OAuth token encryption  
- Neon Postgres enforces `sslmode=require` on all connections  
- All secrets stored in `.env` (gitignored, never committed)  
**Status: ✅ Satisfied**

---

## A03 — Injection
**Controls:**  
- Drizzle ORM used exclusively — zero raw SQL strings in codebase  
- `proxy.ts` middleware detects 7 SQL injection patterns (admin bypass, DROP TABLE, UNION SELECT, comment injection) at severity 8–10 and blocks with 403  
- Chatbot detects prompt injection, XSS, command injection, path traversal  
- All injection attempts logged to `attack_logs` DB table with geo-lookup  
**Status: ✅ Fully Satisfied**

---

## A04 — Insecure Design
**Controls:**  
- Zero Trust policy — all user input treated as malicious by default  
- AI tools (MCP) cannot modify security configs or session logic  
- Security requirements defined in PRD before development  
**Status: ✅ Satisfied**

---

## A05 — Security Misconfiguration
**Controls:**  
- Arcjet WAF active in `proxy.ts` — shield, bot detection, token bucket rate limiting (50 req/10s)  
- Custom user-agent validation blocks `curl`, `wget`, `python-requests`, `postman`, etc.  
- Browser whitelist: only `Mozilla/` with Chrome/Safari/Firefox/Edge/Opera signatures allowed  
- CSP headers set on every response via `proxy.ts`  
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` all active  
- HSTS with `max-age=63072000; includeSubDomains; preload`  
- Errors sanitized — no stack traces to client  
- `.env` gitignored  
**Status: ✅ Satisfied**

---

## A06 — Vulnerable and Outdated Components
**Controls:**  
- Modern stack: Next.js 16, React 19, Drizzle ORM (all current stable)  
- `pnpm-lock.yaml` ensures deterministic dependency resolution  
**Gap:** No automated `pnpm audit` in CI pipeline  
**Status: ⚠️ Partial**

---

## A07 — Identification and Authentication Failures
**Controls:**  
- **Clerk** handles all authentication — MFA, session management, OAuth (Google, GitHub)  
- Clerk enforces secure session tokens with automatic rotation  
- Arcjet rate limiting prevents brute force (50 req/10s per IP)  
- Protected routes enforced via Clerk middleware in `proxy.ts`  
**Status: ✅ Satisfied**

---

## A08 — Software and Data Integrity Failures
**Controls:**  
- All data mutations go through authenticated Server Actions  
- AI-generated content validated before DB commit  
- Dev log (`docs/dev_log.md`) maintains audit trail of all changes  
**Gap:** No signed commits enforced on main branch  
**Status: ⚠️ Partial**

---

## A09 — Security Logging and Monitoring
**Controls:**  
- Real-time attack dashboard with geolocation world map (world.svg)  
- SQL injection, rate limit, bot, and shield events logged to `attack_logs` table with IP, severity, type, city, country, lat/lon  
- Threat Activity chart pulls **real hourly data** from DB via `/api/hourly-stats`  
- Peak Threat Hours bar chart shows attacks by hour-of-day (0–23)  
- Attack types bar chart and severity donut chart from live data  
- **Alert emails** sent via Resend for severity ≥ 5 events  
- Block success rate and threat counts tracked  
**Status: ✅ Satisfied**

---

## A10 — Server-Side Request Forgery (SSRF)
**Controls:**  
- No user-controlled URL fetching in the application  
- Server Actions only interact with internal DB and validated APIs  
- Arcjet validates all incoming requests at middleware level  
**Status: ✅ Satisfied**

---

## Summary

| # | Risk | Status |
|---|------|--------|
| A01 | Broken Access Control | ✅ Satisfied |
| A02 | Cryptographic Failures | ✅ Satisfied |
| A03 | Injection | ✅ Satisfied |
| A04 | Insecure Design | ✅ Satisfied |
| A05 | Security Misconfiguration | ✅ Satisfied |
| A06 | Vulnerable Components | ⚠️ Partial |
| A07 | Auth Failures | ✅ Satisfied |
| A08 | Integrity Failures | ⚠️ Partial |
| A09 | Logging & Monitoring | ✅ Satisfied |
| A10 | SSRF | ✅ Satisfied |

**8 Satisfied / 2 Partial / 0 Failed**

### Remaining Gaps
1. Add `pnpm audit` to GitHub Actions CI (A06)
2. Enforce signed commits on main branch (A08)
