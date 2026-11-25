# Project Status — Sergi Tugas Art Studio

_Last updated: 2026-11-25_

## Current phase

**Phase 10 — Security & production readiness: complete, merged to `main`. All 10 phases are implemented.**
What remains is inputs and decisions (OPEN_QUESTIONS.md) and the first real deployment (DEPLOYMENT.md).

See **OPEN_QUESTIONS.md** for everything still pending from the artist, the business and hosting.

## Phase 0 — Repository audit (done)

- The GitHub repo `pmiramonteso/artSergi` was **empty**: no commits, no files, no deployment configuration.
- Local toolchain: Node 26.13.0, npm 11.20.0, git 2.56. pnpm is not installed.
- Nuxt 4.7 requires Node `^22.22.3 || ^24.15.0 || >=26`, so **the Node version on the Sered cPanel host is the first thing to check.**

## Phase 1 — Completed tasks

- [x] Nuxt 4.7 app (`app/` directory convention), Vue 3.5, TypeScript strict
- [x] Tailwind CSS v4 through `@tailwindcss/vite`, with the approved palette registered as theme tokens
- [x] ESLint (`@nuxt/eslint`, flat config), Prettier with the Tailwind class-sorting plugin, `.editorconfig`, `.gitattributes`
- [x] Environment configuration: `runtimeConfig` + `.env.example`. No domain is hardcoded.
- [x] `X-Robots-Tag: noindex` on every deployment unless `NUXT_PUBLIC_SITE_INDEXABLE=true`
- [x] `/api/health` liveness endpoint
- [x] Custom error/404 page (returns a real 404 status)
- [x] Vitest with the first unit test (`normalizeSiteUrl`)
- [x] GitHub Actions CI: lint, format, typecheck, tests, build, audit
- [x] Project docs: this file, ARCHITECTURE.md, SECURITY.md, ASSET_GUIDELINES.md

## Phase 2 — Completed tasks

- [x] Full token set in `app/assets/css/main.css` (`@theme`): palette with semantic aliases, fluid type scale, layout and spacing, grid, shadows and motion
- [x] Text-safe variants `tomato-ink` and `butter-ink`. Tomato and butter text on paper fails WCAG AA (2.66 and 1.57), so those two base tones are for decoration only
- [x] `shared/design/tokens.ts` mirrors the tokens for TypeScript (GSAP/Three.js later). A unit test keeps it in sync with the CSS and checks every approved text pair for AA contrast
- [x] Self-hosted fonts (Fontsource): Space Grotesk Variable and Instrument Serif (regular + italic), Latin and Latin-ext only
- [x] Utilities: `page-container`, `bg-grid` (responsive density), `bg-paper-grain` (SVG noise, no bitmap) and `text-eyebrow`
- [x] Components: `UiContainer`, `UiButton`, `UiLabel`, `UiSectionHeading`, `UiPlaceholder` (hatched and labeled, so it can never be mistaken for artwork), plus `DecorStar`, `DecorDots`, `DecorSquiggle` and `DecorArrow`
- [x] Base accessibility: skip link, visible focus, reduced-motion override, text balance and pretty wrapping
- [x] `/design-system` reference page (noindex)
- [x] Temporary homepage rebuilt with the system. The artist name is typeset and clearly labeled "Placeholder lettering"
- [x] Visual check of headless screenshots at 390 px, 1024 px and 1440 px: no horizontal overflow

## Phase 3 — Completed tasks

- [x] `LivingCanvas.vue`: a fixed, decorative background in 5 layers (paper + grain, masked grid, color fields, hand-drawn details, scroll motion)
- [x] Scenes for each homepage section (`app/utils/canvas-scenes.ts`). GSAP interpolates between consecutive scenes with scrubbed ScrollTriggers, one timeline per section boundary
- [x] Fields that change sides fade out, move while invisible and fade in, so they never sweep across the text
- [x] Depth parallax on the details layer
- [x] Intro on load: grid → fields → details, with the squiggle drawn in. An inline head script hides intro elements before first paint, with a 3 s fallback, so the final state never flashes
- [x] Mobile is its own composition, not a scaled-down desktop: fewer fields pushed to the edges, lighter fields behind text, no details outside the hero
- [x] Reduced motion: a static composition with no intro, scroll motion or parallax (`gsap.matchMedia`)
- [x] Works without JS: the hero composition is rendered on the server with CSS variables for each breakpoint
- [x] GSAP is lazy-loaded in its own chunk (prefetched, not preloaded) and the plugin is registered once. `ScrollTrigger.refresh()` runs after fonts and images load
- [x] Composables: `useScrollAnimations` (scoped `gsap.context` + `matchMedia`, reverted on unmount) and `useReducedMotion`
- [x] The homepage has a section skeleton in the final order (labeled placeholders) for reviewing the transitions
- [x] Checked in a headless browser at 1440 px and 390 px and with reduced motion: no console errors, no horizontal overflow

## Phase 4 — Completed tasks

- [x] `LayoutHeader`: fixed header with items on paper chips (readable over any background). Desktop has inline nav; mobile uses a native `<dialog>` menu (focus moves inside, Escape closes, `aria-expanded`, background scroll locked). Nav points to homepage sections until the pages exist
- [x] `HeroSection` ("The Floating Studio"): a centred `<h1>` lettering with three floating framed artworks around it (upper-left large, right-centre medium, lower-left partly outside the frame), editorial labels, decorative marks and a scroll cue
- [x] Separate positions per breakpoint. Desktop: 3 artworks + labels. Tablet: 3 smaller. Mobile: 2 artworks, no labels, name on two lines. The lettering is always above the artworks
- [x] `useHeroAnimation`: intro timeline (artworks 0.3–1.1 s, lettering clip reveal 0.7–1.4 s, details 1.0–1.6 s), idle floating from 1.6 s (desktop/tablet, paused off-screen), and a scroll transition where the artworks drift down and straighten toward Selected Works while the details fade
- [x] `usePointerParallax`: depth-based pointer parallax with `gsap.quickTo` and a passive listener. Inactive off-screen and disabled on touch, small screens and reduced motion
- [x] `useIntroGate`: a shared mechanism that hides elements before first paint (canvas + hero), with a 3 s fallback
- [x] Content lives in `app/data/hero.ts`. Real photos and lettering replace the placeholders by setting `image` / `heroLettering`. The first artwork gets `fetchpriority="high"` (LCP candidate)
- [x] Checked in the browser: 1440, 1024 and 390 px, mid-scroll, and reduced motion. No console errors and no horizontal overflow. Pointer parallax measured (moves in proportion to depth on desktop, none on touch). Mobile menu tested (opens, focus, Escape, aria-expanded)

## Phase 5 — Completed tasks

- [x] Homepage sections as independent components, in order: `HomeIntro`, `HomeSelectedWorks`, `HomeArtMail`, `HomeCollection`, `HomeProcess`, `HomeAnnual`, `HomeNewsletter`, plus `LayoutFooter`
- [x] Typed data: `shared/types/artwork.ts` (spec model), `app/data/artworks.ts` (3 sold works; unknown fields stay `null` and show "To be confirmed"), `app/data/collections.ts` (Places We Keep Nº 001, pilot of 50), `app/data/site.ts` (contact, socials and legal pages; empty values are hidden)
- [x] The hero now derives its artworks from the artwork data (single source)
- [x] Central prices in `shared/constants/products.ts` (integer cents, the brief's hypothesis), hidden while `PRICING_PUBLISHED = false` ("Announced at launch")
- [x] `isPurchasable()` is the single commerce gate. Sold and archived works are never purchasable (tested)
- [x] `/works` and `/works/[slug]` (detail page with breadcrumb, sold notice, no checkout; 404 for unknown slugs)
- [x] `/legal/[slug]` reserved pages (privacy, cookies, terms, shipping & returns), noindex, saying "being prepared". 404 for anything else
- [x] Newsletter: an accessible form (labels, inline errors, `aria-invalid`, live status), a honeypot and a timing check. The API at `POST /api/newsletter` does Zod validation and a per-IP rate limit (5 per 10 min). **No provider is connected:** valid sign-ups get 503 "opens soon" and nothing is stored or logged
- [x] Scroll reveal (`useRevealOnScroll`, batched, plays once, never leaves content hidden)
- [x] Canvas readability: outside the hero, color fields are capped at 35% opacity and details are hidden. A unit test checks that ink text stays at AA contrast over every field
- [x] Every placeholder is labeled: copy ("Placeholder: not an approved artist statement", "Biography pending", "Working name") and images (hatched placeholders, plus a compact variant for small slots)
- [x] Checked: 64 unit tests; API responses checked against the running server (400 / 503 / 429 + Retry-After / 404 for GET); routes 200/404; screenshots at 1440 and 390 px with no console errors and no horizontal overflow

## Phase 6 — Completed tasks

- [x] `@nuxtjs/i18n` 10: `/en/`, `/es/`, `/ca/` (prefix strategy, no unprefixed duplicates). `/` redirects by browser language (cookie `i18n_locale`), falling back to EN. The locale list and default live in `shared/constants/i18n.ts`
- [x] Localized slugs: `/en/works`, `/es/obras`, `/ca/obres` (+ `[slug]`). Artwork slugs are the same in every language
- [x] All UI copy in `i18n/locales/{en,es,ca}.json` (ES/CA by Claude, pending native review: OPEN_QUESTIONS A10). Content data uses `LocalizedText`. A test checks that every locale has exactly the same keys
- [x] Accessible language switcher (real links, `lang`/`hreflang`, `aria-current`) in the header and the mobile menu
- [x] Per page: localized title and description, Open Graph (title, description, site name, type, `og:locale` + alternates), absolute canonical, hreflang alternates + x-default, `<html lang>`
- [x] Single origin: `NUXT_PUBLIC_SITE_URL` feeds i18n canonicals/hreflang, the sitemap, robots and JSON-LD (falls back to the request origin when unset)
- [x] `/sitemap.xml` (indexable pages × locales, with xhtml alternates) and `/robots.txt` (Disallow-all unless `NUXT_PUBLIC_SITE_INDEXABLE=true`). The static `public/robots.txt` was removed
- [x] JSON-LD with only verified facts: WebSite + Person (home), BreadcrumbList (work page), VisualArtwork only when a real title exists. No prices, ratings or stock
- [x] Accessibility: fixed `aria-labelledby` pointing to missing ids (new `headingId` prop), placeholder roles (`div[role=img]`), and footer contrast. An axe-core audit (WCAG 2.0/2.1/2.2 AA + best practice) of 4 pages × 3 locales shows **0 violations from site code** (the only finding is the Nuxt DevTools panel, dev only)
- [x] Checked against a production build: canonical/hreflang use the configured domain, robots and sitemap output, 15 sitemap URLs, no noindex header when indexable

## Phase 7 — Completed tasks

- [x] PostgreSQL + Drizzle ORM (`drizzle-orm`, `postgres` driver). Schema in `server/database/schema/*`: **24 tables** (the 19 from the spec plus artwork/collection/product translations, user_roles and inventory_reservations)
- [x] Integrity in the database itself: 23 FKs, 23 CHECK constraints (no oversell, integer cents ≥ 0, order totals must add up, line total = unit × qty, refunded ≤ paid, ISO currency/country, gift subscriptions need a recipient…), unique keys (Stripe ids, order idempotency key, case-insensitive email) and indexes
- [x] Versioned SQL migrations (`server/database/migrations`). Applied successfully to a real PostgreSQL 17 (Docker) and to PGlite
- [x] Repositories with two implementations: database (Drizzle) and static (`app/data`). Without `NUXT_DATABASE_URL` the site serves the static content, so previews keep working. A test proves both return identical data
- [x] Public API (Zod-validated, DTOs only, no internal columns): `GET /api/artworks`, `GET /api/artworks/:slug`, `GET /api/collections/:slug`. Pages, hero and sitemap now read through it
- [x] Inventory service: atomic conditional reservation (race-safe), idempotent per reference, commit/release/expire, plus a scheduled `inventory:expire` task every 5 min (not on Vercel)
- [x] Domain logic (pure, tested): subscription lifecycle (Stripe statuses, valid transitions, out-of-order webhooks ignored, entitlement) and order arithmetic (integer cents, order numbers)
- [x] Idempotent seed (`npm run db:seed`, a Nitro task) from the approved content. Art Mail offers are created **inactive** with the hypothesis prices; only the single collection gets stock (50); no shipping methods (not defined)
- [x] `compose.yaml` for a local Postgres (localhost only), and `npm run db:generate | db:migrate | db:studio | db:seed`
- [x] Tests: unit + integration projects. PGlite runs the real migrations in memory (seed, repositories, constraints, inventory: 60 buyers for 50 units). An optional real-Postgres test with 20 connections (`TEST_DATABASE_URL`) showed **200 simultaneous checkouts → exactly 50 reservations**
- [x] **Bug from Phase 6 found and fixed:** "All works" and the breadcrumbs linked to `/es/works` and `/ca/works` (404) instead of `/es/obras` and `/ca/obres`. Regression test added; the internal link crawler shows 27 URLs × 3 locales with 0 broken
- [x] Checked end-to-end with a real DB: migrate → seed (idempotent) → API/pages served from Postgres. Without a DB the site falls back to static content

## Content update — real paintings (2026-11-25)

- [x] The 3 sold paintings supplied by Sergi are live in the hero, Selected Works, /works and the detail pages
- [x] Originals preserved in `assets-src/artworks/<slug>/original.jpeg`. Web derivatives (WebP 480w + full size, 33–77 KB) built reproducibly by `npm run images` (sharp: crop to the framed painting, no colour filters, never upscaled). Crop boxes are in `assets-src/artworks/manifest.json`
- [x] Alt text in EN/ES/CA describing only what is visible. Title, year, medium, size and description stay "to be confirmed" (A2)
- [x] `srcset`/`sizes` on artwork images. The hero's first painting keeps `fetchpriority="high"` (LCP)
- [x] Tests: alt text in every locale, every referenced file exists, and DB ↔ static parity in all 3 locales (110 tests)
- [ ] Higher-resolution photos (A1): current sources are WhatsApp-compressed, slightly soft on the desktop detail page

## Phase 8 — Completed tasks

- [x] **Safety switch** (`shared/domain/commerce.ts`, `NUXT_COMMERCE_MODE`): `off` by default; `test` only accepts Stripe TEST keys; `live` is refused unless the keys are live AND `PRICING_PUBLISHED` is true AND products/variants are `active`. Any mismatch disables checkout instead of guessing
- [x] `POST /api/checkout`: the client sends only `{ sku, quantity, locale }` plus an `Idempotency-Key`. Prices, currency and totals come from the database. It creates the order, reserves stock (pilot of 50) and opens a Stripe Checkout session (payment or subscription with recurring price data). If Stripe fails, the stock is released and the order cancelled. Rate-limited
- [x] `POST /api/webhooks/stripe`: signature verified on the raw body. Idempotent via `webhook_events` (duplicates skipped, failures retried). Handles: session completed / async success → paid (**the charged amount must equal the order total**), stock committed, payment + customer recorded; async failure / expired → cancelled, stock released; subscription created/updated/deleted (out-of-order safe, periods from subscription items); charge.refunded
- [x] `GET /api/checkout/status`: the success page reads OUR database. If the webhook is late it reconciles server-to-server with Stripe, so a browser redirect is never trusted. No personal data in the response
- [x] `GET /api/commerce/offers`: purchasable Art Mail offers (empty when commerce is off, so the UI keeps "Notify me")
- [x] UI: offers with Buy/Subscribe in the collection section, success/cancel pages (noindex, live status), a fixed TEST MODE notice, EN/ES/CA copy. Stripe Checkout has no Catalan, so `ca` uses `auto`
- [x] Tests: 22 new (132 in total): safety switch, schema (client prices rejected), checkout (server price, recurring, idempotency, live refuses unapproved items, sold out, Stripe failure releases stock) and webhooks with **real Stripe signatures** (tampering rejected, paid/duplicate/amount-mismatch/unpaid/expired/refund/subscription ordering)
- [x] End-to-end against real PostgreSQL + HTTP: offers listed; missing idempotency key or a client price → 400; a Stripe error → order cancelled and reservation released; webhooks without, forged or tampered signatures → 400; valid → order paid; duplicate → skipped; status endpoint → paid
- [ ] Not done here: **Customer Portal** (needs customer accounts, Phase 9); **real Stripe test run** (needs the owner's Stripe TEST keys, see README); shipping rates and tax (B3/B4)

## Phase 9 — Completed tasks

- [x] **Authentication with Better Auth 1.7** (maintained, Drizzle adapter), not custom crypto: email + password (scrypt hashing), **required email verification**, password reset (1 h token, **revokes all sessions**), DB-stored revocable sessions (30 days, refreshed daily) in HttpOnly cookies, sign-out invalidation, **TOTP 2FA with backup codes**, account deletion, and **DB-backed rate limiting** (sign-in 5/min, sign-up, reset, 2FA). Session tokens are stripped from JSON responses, so browser JS never sees them
- [x] Schema: Better Auth tables (`users`, `sessions`, `accounts`, `verifications`, `two_factors`, `rate_limits`) with UUID ids. Roles live in `users.role` (admin plugin), replacing the earlier placeholder roles tables. The initial migration was regenerated (no production DB existed yet): **27 tables**
- [x] Transactional email via SMTP (`NUXT_SMTP_URL`). In development without SMTP, links are printed to the dev console; in production without SMTP, sending fails loudly. Trilingual plain-text templates
- [x] **Admin authorization on the server for every request:** role `admin` AND 2FA enabled (`MFA_REQUIRED` otherwise). First-admin bootstrap through `NUXT_ADMIN_EMAILS` (verified email only), persisted and audited
- [x] Admin API (Zod strict schemas, no caching): summary, orders (list/detail/fulfilment: paid→fulfilled→shipped with tracking→delivered; cancel only unpaid; **staff can never set payment states**), catalogue (price in cents, active, which also clears a stale Stripe price), stock (never below reserved + sold), artworks (facts + EN/ES/CA translations), customers, subscriptions, audit log. **Every change is written to admin_audit_logs with a field-level diff**
- [x] Customer area (EN/ES/CA, noindex): sign-in (with 2FA step), sign-up, forgot/reset password (no account enumeration), account overview (own paid orders, matched by user or **verified** email; subscriptions), **Stripe Customer Portal** for billing, security page (2FA with locally generated QR via `uqr`, backup codes, disable) and account deletion. Safe same-site redirects only
- [x] Admin panel `/admin` (English, not localized, noindex): overview, orders, catalogue & stock, artworks, customers & subscriptions, audit log
- [x] Tests (151): auth integration (hash ≠ password, verification required, short passwords rejected, rate limit 429, sign-out invalidates, reset revokes sessions, 2FA blocks password-only sign-in), admin services (fulfilment path, forbidden transitions, audited price change, stock floor, artwork edits), customer isolation (only own and verified data), order-status and schema rules
- [x] End-to-end against real PostgreSQL over HTTP: anonymous 401 → unverified 403 → verified account → allowlisted admin without 2FA → MFA_REQUIRED → 2FA enabled → password-only sign-in has no admin access → TOTP → admin 200 → artwork edit visible on the public API, invalid or unknown fields 400, audit entries written. Admin and account pages render server-side with the session; axe shows 0 violations from site code
- [x] **Bugs found and fixed during e2e:** Zod 4 `record(enum)` required every locale (now `partialRecord`, with a test); session token echoed in JSON bodies (now stripped)

## Phase 10 — Completed tasks

- [x] **Security headers + per-request nonce CSP** (prod), API CSP, HSTS on https, `private, no-cache` HTML. Measured in a real browser on a production build: 0 CSP violations, and GSAP still loads and animates
- [x] **Fix:** client IP for rate limiting was spoofable via the first `X-Forwarded-For` entry. Now `NUXT_CLIENT_IP_HEADER` (Cloudflare / last hop / peer), tested
- [x] **DB-backed rate limits** (shared across processes, exact under 20 concurrent hits) for checkout and newsletter; in-memory only as a fallback
- [x] Request body limits (413), JSON error logging without PII, `/api/health/ready` (DB check)
- [x] Startup **config audit** (fatal on unsafe settings, warnings otherwise, no secret values in logs)
- [x] Opt-in **migrate-on-start** for cPanel (migrations shipped in `.output/server/migrations`, idempotent, exits on failure). Verified on a fresh Postgres 17: 27 tables created, restart is a no-op
- [x] `server.cjs` Passenger entry; **DEPLOYMENT.md** (cPanel layout with atomic releases, env vars, Stripe and Cloudflare settings)
- [x] **Release workflow** (manual; full checks + prod audit; artifact + sha256; deploy only through the protected `production` environment, with pinned SSH host key, atomic symlink switch, Passenger restart and smoke test). **Dependabot** for npm and Actions
- [x] **Backups:** `scripts/db-backup.sh` / `db-restore.sh` (custom-format dump, integrity check, sha256, optional age encryption, retention; restore refuses non-empty targets). **Restore drill passed** (identical row counts)
- [x] **OPERATIONS.md** (monitoring, backups, rollback, incident checklist, routine) and an OWASP Top 10 mapping in SECURITY.md

## Content update — artist portrait and signature (2026-11-25)

- [x] **Studio portrait** in the artist introduction: optimized master (1818×2400, 288 KB, no metadata) in `assets-src/artist/` (the 5.6 MB camera original is kept by the owner outside git), WebP 480/960/1400 (24–95 KB) with **all metadata stripped** (the original has no GPS), EN/ES/CA alt text describing only what is visible, and added as `image` to the Person JSON-LD
- [x] **Signature** vectorized to SVG (`npm run lettering`, potrace as a dev-only tool: traced, not redrawn, brand ink colour, 16 KB). Used as the hero `<h1>` (alt "Sergi Tugas", clip-reveal intro), and in the header and footer. The "placeholder lettering" label is gone
- [x] `npm run images` now builds artworks and artist photos from one script. Hero decorations moved so they no longer cross the signature

## Phase 11 — QA & launch preparation (beyond the original 10 phases)

- [x] **Playwright E2E suite** (`npm run test:e2e`, 33 tests × desktop/mobile against the production build): homepage in 3 locales (signature h1, real paintings, no console errors), no horizontal overflow, canonical/hreflang, language switcher keeping the page with localized slugs, "All works" navigation, mobile menu, sold work not purchasable, real 404, newsletter validation + honest server state, **axe WCAG 2.2 AA on 4 pages**, CSP header and zero CSP violations. Stable (66/66 on repeat). Runs in CI after the main job
- [x] **Bugs found by E2E and fixed:**
  - Scroll reveal used `visibility: hidden`, which removed below-the-fold sections from the accessibility tree (screen readers couldn't reach them). Now opacity only
  - A newsletter submit before hydration did a GET that put the email in the URL. The form is now `method="post"`
- [x] **Social share image** (A11): 1200×630 from real paintings + signature (`npm run og`), absolute `og:image` with size/alt, `summary_large_image`. Artwork pages use absolute image URLs
- [x] **Lighthouse (production build):**

  |                            | Performance | Accessibility | Best practices | LCP                   | CLS   |
  | -------------------------- | ----------- | ------------- | -------------- | --------------------- | ----- |
  | Desktop                    | 99–100      | 100           | 100            | 0.8 s                 | 0.001 |
  | Mobile (simulated slow 4G) | 92–93       | 100           | 100            | 3.1–3.4 s (was 4.3 s) | 0     |

  SEO shows 69 only because previews are noindex (intended). Fixes: the LCP artwork is no longer faded in, the LCP image is preloaded, 240w artwork variants, label-in-name (WCAG 2.5.3) on the scroll cue, a 7-day cache for public images, and `private, no-cache` HTML (bfcache works)

- [ ] Mobile LCP target (< 2.5 s) not yet met in the simulation. Next lever if field data (Search Console) confirms it: trim initial JS (~48 KB unused in the entry chunk)

## Pending (owner)

- [ ] Confirm Vercel is connected and preview deployments build (check the Hobby plan terms before any commercial use)
- [ ] Turn on branch protection on `main` so CI must pass before merging
- [ ] Check the Sered cPanel account: Node version, Node.js App Manager, env vars, PostgreSQL availability

## Known issues

- Accounts need `NUXT_DATABASE_URL` + `NUXT_AUTH_SECRET`; otherwise `/api/auth/*` returns 503. The header "Account" link only shows when commerce is not `off`.
- Production email needs an SMTP provider (OPEN_QUESTIONS B6).
- Deleting an account keeps that person's orders (accounting) but unlinks them; the privacy policy must say so (B5).

- Commerce needs a database. Without `NUXT_DATABASE_URL` checkout stays disabled (503) even in test mode.
- Shipping is 0 and tax is not computed until B3/B4 are decided. Live mode is blocked anyway.
- The gift product is sold as a one-off payment (provisional, B11) and does not collect the recipient yet.
- The checkout rate limit is in-memory (single process), like the newsletter's.

- **Production migrations:** run `npm run db:migrate` from CI or a trusted machine against the production DB (not from the app process). This is documented in ARCHITECTURE; the automated pipeline comes in Phase 10.
- `npm run db:seed` runs as a Nitro task and needs the dev server running with `NUXT_DATABASE_URL` set.
- A fresh, unseeded database shows an empty site (no artworks). Always seed after migrating.

- No social sharing image yet (OPEN_QUESTIONS A11), so `twitter:card` is `summary` without an image.
- Legal page slugs are not localized (`/es/legal/privacy`). Fine for now; revisit when the real texts exist.

- The newsletter rate limit is in-memory (one process). Production needs a shared store or Cloudflare rules (SECURITY.md).
- The Art Mail Club section CTA points to the collection section because there is no club page yet.

- `npm audit` reports 9 **moderate** advisories, all from one root cause: `minimatch` (ReDoS, GHSA-g3hv-75wg-m249) pulled in through `nitropack → archiver → readdir-glob`. This is build-time tooling, not the request path. The suggested "fix" downgrades Nuxt, so it is not applied. CI fails only on high or critical advisories. Re-check when Nuxt/Nitro update.
- npm 11 shows a warning that the `esbuild` postinstall script is not approved. The build works anyway because the platform binary comes from an optional dependency.
- The inline intro script will need a CSP hash or nonce when the CSP lands (Phase 6/10).
- Scene transitions assume each section is at least ~70% of the viewport tall (the trigger range is 85% → 15%). Shorter sections would overlap transitions. Revisit when the real sections exist (Phase 5).
- `public/robots.txt` is the scaffold default (allow all). Phase 6 will replace it with a generated, environment-aware version. Until then the noindex header keeps previews out of search engines.

## Technical decisions

See ARCHITECTURE.md → "Decision log".

## Next actions

All phases are built. To go live:

1. **Hosting (C1–C3):** confirm Node 24, a CommonJS startup file, SSH and PostgreSQL on Sered (or choose a managed Postgres).
2. **Business (B1–B18):** club name, prices, shipping, entity/tax, legal texts, email provider, admins, domain.
3. **Content (A1–A11):** high-res photos, painting data, lettering, statement, bio, collection artwork.
4. **Stripe:** create the account and run a TEST purchase (README). Then configure the live webhook and Customer Portal.
5. First deployment following DEPLOYMENT.md, with `NUXT_PUBLIC_SITE_INDEXABLE=false` until launch day.
