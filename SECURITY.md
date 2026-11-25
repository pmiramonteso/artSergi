# Security — Sergi Tugas Art Studio

The aim is layered protection, a small attack surface, monitoring and the ability to recover. No website is immune.

## Reporting

Report suspected vulnerabilities privately to the repository owner. Do not open public issues for them.

## In place (Phase 1)

- **Secrets:** only in env vars. `.env*` is git-ignored except `.env.example`, which holds no values. Server-only config is kept apart from `runtimeConfig.public`.
- **Indexing:** `X-Robots-Tag: noindex, nofollow` on every deployment unless it is explicitly marked as production.
- **Health endpoint** reveals no version, environment or dependency details.
- **CI:** lint, strict type check, tests, build, and `npm audit` (fails on high/critical) on every PR. The workflow token is `contents: read`.
- **Error page** shows no stack traces or internal details.

- **Newsletter endpoint (Phase 5):** Zod validation (email normalised, max length, literal consent, locale enum), a honeypot and a timing check, and a per-IP fixed-window rate limit returning 429 + Retry-After. No PII is stored or logged while no provider is configured. The client IP comes from `X-Forwarded-For` only when `NUXT_TRUST_PROXY=true`, so it cannot be spoofed when the app is reached directly.
  - Limitation: the rate-limit store is in-memory per process. Add a shared store and/or Cloudflare rate limiting before launch.

- **Database (Phase 7):** credentials only in `NUXT_DATABASE_URL` (server-only runtime config). Queries go through Drizzle's parameterised builder (no string-built SQL). Small pool, and query parameters are never logged. Public APIs return DTOs, so internal ids, timestamps and foreign keys are not exposed. Route/query params are Zod-validated (slug regex, locale enum). Invariants are enforced by the database (CHECK/FK/UNIQUE).
  - Use a least-privilege DB role in production (DML only; migrations run with a separate owner role).
  - `compose.yaml` credentials are for local development only and bound to 127.0.0.1.

- **Payments (Phase 8):** Stripe secret and webhook secret are server-only runtime config. The commerce switch refuses live keys outside live mode and live mode without validated pricing. The client can't set prices (strict Zod schema). The webhook signature is verified on the raw body, and invalid or tampered requests get 400. Events are deduplicated by id. The amount charged must equal the order total. Orders are marked paid only by verified webhooks or server-side reconciliation with Stripe. Checkout is rate-limited and needs an Idempotency-Key. No card data ever touches our servers (Stripe-hosted Checkout). Webhook payloads are not stored.
  - CSP (Phase 10) must allow Stripe's documented origins only if Stripe.js is ever embedded. Hosted Checkout is a plain redirect.

- **Authentication (Phase 9):** Better Auth handles scrypt password hashing (10–128 chars), required email verification, 1 h reset tokens that revoke all sessions, DB sessions in HttpOnly cookies (Secure on https, `st.` prefix, SameSite=Lax), 30-day expiry refreshed daily, sign-out invalidation, TOTP 2FA + backup codes with lockout, account deletion, and DB rate limits (sign-in 5/min/IP, sign-up 5/5 min, reset 3/5 min, 2FA 5/min). Session tokens are removed from JSON responses. Password reset gives no account enumeration.
- **Authorization:** `requireUser` / `requireAdmin` run on the server for every request. Admin requires role `admin` AND 2FA. The bootstrap allowlist needs a verified email and is audited. Customers only ever see their own data (verified email or linked customer). Admin inputs use strict Zod schemas (unknown fields → 400), and admin responses are `no-store`. Every admin mutation is audited with a field diff.
- Better Auth's trusted origins (CSRF on its endpoints) = `NUXT_PUBLIC_SITE_URL`.

- **Hardening (Phase 10):**
  - Per-request **nonce-based CSP** on HTML (`script-src 'self' 'nonce-…' 'strict-dynamic'`, no unsafe-inline/eval for scripts; `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`), with zero violations measured in a real browser on production builds (GSAP still loads and animates).
  - Restrictive CSP on APIs. HSTS on https. nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options DENY, COOP/CORP same-origin. HTML is `private, no-cache`.
  - Body size limits (64 KB; 1 MB for webhooks).
  - **Spoof-resistant client IP** (`NUXT_CLIENT_IP_HEADER`; the first X-Forwarded-For entry is never trusted).
  - **DB-backed, multi-process rate limits** for checkout and newsletter (exact under concurrency, tested), plus Better Auth's own.
  - Startup **config audit** (refuses unsafe configs).
  - JSON error logs without PII.
  - Readiness probe without internals.
  - Release workflow: manual, full checks + audit, checksum, protected environment with approval, pinned SSH host key.
  - Dependabot.
  - Backups with encryption option and a verified restore drill.

## OWASP Top 10 (2021) mapping

| Risk                          | Controls                                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A01 Broken access control     | Server-side `requireUser`/`requireAdmin` (role + 2FA) on every request; customers see only their own data; strict schemas reject extra fields; tests for isolation |
| A02 Cryptographic failures    | scrypt via Better Auth; HttpOnly/Secure cookies; HSTS; secrets only in env; tokens hashed or opaque; no card data (Stripe-hosted)                                  |
| A03 Injection                 | Drizzle parameterised queries; Zod on all inputs; CSP with nonces; Vue escaping (only one `v-html`: a locally generated QR SVG)                                    |
| A04 Insecure design           | Prices only server-side; payment state only from verified webhooks; stock invariants enforced by DB CHECKs; commerce safety switch                                 |
| A05 Security misconfiguration | Config audit at startup; noindex by default; security headers; prod-only CSP; `.env.example` without values                                                        |
| A06 Vulnerable components     | `npm audit` in CI and release; Dependabot weekly; pinned lockfile                                                                                                  |
| A07 Auth failures             | Rate limits (DB), verification required, reset revokes sessions, 2FA, no account enumeration on reset                                                              |
| A08 Integrity failures        | Stripe signature on the raw body; release checksum; protected deploy environment; lockfile `npm ci`                                                                |
| A09 Logging & monitoring      | Admin audit log with diffs; JSON error logs (no PII); readiness probe; runbook                                                                                     |
| A10 SSRF                      | No user-supplied URLs are fetched server-side; outbound calls only to Stripe/SMTP from config; redirects are same-site only                                        |

## Known limitations

- No automated DAST/SAST beyond ESLint + strict TypeScript. CodeQL/secret scanning need GitHub Advanced Security on private repos (paid). Consider them, or a periodic external pentest, before scaling.
- The in-memory limiter is only a fallback when there is no DB.
- Style attributes are allowed by CSP (`style-src-attr 'unsafe-inline'`) for SSR layout and animation; the risk is low (no script execution).

## Planned controls (by phase)

| Control                                                                                                                                                     | Phase  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Zod validation of every body, query, route param and webhook payload                                                                                        | 7+     |
| Security headers: CSP (nonce-based, no `unsafe-eval`, Stripe origins allowed), HSTS, nosniff, Referrer-Policy, Permissions-Policy, `frame-ancestors 'none'` | 6/10   |
| Rate limiting (newsletter, login, reset, checkout, contact) on a shared store, not in-memory only                                                           | 5/9/10 |
| Parameterised queries only (Drizzle), least-privilege DB user                                                                                               | 7      |
| Stripe: server-side prices, signed webhooks, stored event IDs (idempotency), no trust in success redirects                                                  | 8      |
| Auth: maintained library, secure/HttpOnly/SameSite cookies, session rotation, admin MFA, RBAC checked on the server, audit log                              | 9      |
| Backups: scheduled DB dumps, encrypted off-site storage, retention policy, restore drills                                                                   | 10     |
| Cloudflare DNS/proxy/WAF in front of the origin (does not replace app-level controls)                                                                       | 10     |

## Notes for the CSP (Phase 6/10)

- `LivingCanvas.vue` adds one small inline `<script>` (the intro flag). Allow it with a hash or nonce, never with `unsafe-inline`.
- GSAP writes inline `style` attributes. This is allowed by CSP's style-src-attr; check it when writing the policy.

## Known advisories

See PROJECT_STATUS.md → Known issues.
