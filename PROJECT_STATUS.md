# Project Status — Sergi Tugas Art Studio

_Last updated: 2026-11-25_

## Current phase

**Phase 7 — Database & backend: complete, merged to `main`.**
Next phase: Phase 8 (e-commerce in Stripe **test mode**). It needs business decisions first: B2 prices, B3 shipping, B4 tax/legal entity, B11 gift model.

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

## Pending (owner)

- [ ] Confirm Vercel is connected and preview deployments build (check the Hobby plan terms before any commercial use)
- [ ] Turn on branch protection on `main` so CI must pass before merging
- [ ] Check the Sered cPanel account: Node version, Node.js App Manager, env vars, PostgreSQL availability

## Known issues

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

1. Owner reviews Phases 6–7 locally (switch languages; everything else looks the same).
2. **Hosting (C3, blocking):** confirm whether Sered offers PostgreSQL. If not, choose a managed Postgres (cost to review).
3. **Business decisions before Phase 8:** B2 prices, B3 shipping, B4 tax/legal entity, B11 gift model, B5 legal texts.
4. Phase 8: Stripe Checkout and Billing in **test mode only**, verified webhooks, Customer Portal.
