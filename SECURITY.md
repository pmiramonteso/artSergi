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
