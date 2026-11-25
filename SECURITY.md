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
