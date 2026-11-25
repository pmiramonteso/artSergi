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

## Known advisories

See PROJECT_STATUS.md → Known issues.
