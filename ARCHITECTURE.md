# Architecture — Sergi Tugas Art Studio

One Nuxt 4 application (SSR, Nitro server) serves all three business areas: the portfolio, the Art Mail Club and the shop. It is deliberately a modular monolith with no microservices.

## Current layout

```
app/                    Vue application (Nuxt 4 srcDir)
  components/{ui,decor,hero,home,artwork,layout}/
  composables/          GSAP (useScrollAnimations…), useContent (API fetch)
  data/                 Static content = seed source + no-DB fallback
  pages/                index, works/, works/[slug], legal/[slug], design-system
  plugins/              i18n base URL
i18n/locales/           en / es / ca UI messages
server/
  api/                  artworks, collections, newsletter, health
  database/             schema/ (Drizzle), migrations/ (SQL), seed.ts, client.ts
  repositories/         DB + static implementations, public DTO mapping
  services/             content (repo selection), inventory (reservations)
  routes/               sitemap.xml, robots.txt
  tasks/                db:seed, inventory:expire
  utils/                database, rate-limit, site
shared/
  constants/            i18n (locales, localized paths), products (offers)
  domain/               subscription lifecycle, order arithmetic
  schemas/              Zod: newsletter, content params
  types/ utils/         Artwork/Collection models, formatting, JSON-LD, sitemap
tests/{unit,integration}/
```

## Data access

```
page/component ─useFetch─▶ /api/* (Zod) ─▶ services/content ─┬─ DB repository (Drizzle → PostgreSQL)
                                                             └─ static repository (app/data)  ← no NUXT_DATABASE_URL
```

- Business rules live in `server/services` and `shared/domain`, never in components.
- The database enforces the invariants too (CHECK/FK/UNIQUE): code bugs cannot oversell or create inconsistent totals.
- **Migrations:** `npm run db:generate` after schema changes (commit the SQL). Apply with `npm run db:migrate` against the target DB from CI or a trusted machine. The app process never migrates on its own.

## Planned layout (added only when a phase needs it)

- `app/components/{ui,layout,navigation,hero,artwork,art-mail,shop}`, `app/composables/` (GSAP composables), `app/pages/...` (localized routes). Phases 2–6.
- `shared/{schemas,types,constants}`: Zod schemas and DTO types used on both sides. Phase 5 onward.
- `server/{services,repositories,utils}` and `server/api/{checkout,subscriptions,orders,webhooks,admin,auth}`. Phases 7–9.
- `server/database/{schema,migrations}` (Drizzle + PostgreSQL). Phase 7.
- `tests/{integration,e2e}` (`@nuxt/test-utils`, Playwright). Added with the first feature that needs them.

Empty folders are not created ahead of time.

## Configuration

- All environment-specific values go through `runtimeConfig` in `nuxt.config.ts` and can be overridden by `NUXT_*` env vars (see `.env.example`).
- Keys under `runtimeConfig.public` are sent to the browser. Secrets must go at the top level, which stays server-only.
- The domain is never hardcoded. `NUXT_PUBLIC_SITE_URL` is set per environment and validated with `shared/utils/site-url.ts`.
- Prices, products and inventory will live in the database (Phase 7) and never in components.

## Hosting

| Environment | Target                           | Nitro preset                                        |
| ----------- | -------------------------------- | --------------------------------------------------- |
| Local       | `npm run dev`                    | dev                                                 |
| Preview     | Vercel (preview URLs)            | `vercel` (auto-detected)                            |
| Production  | Sered Plan M, cPanel Node.js App | `node-server` (default): `.output/server/index.mjs` |

**cPanel checklist (to check in the real account before Phase 10):**

1. Node.js version offered. Nuxt 4.7 needs ≥ 22.22.3 (24 LTS recommended). **This is a blocker if it is lower.**
2. Whether the Node.js App Manager (Passenger) can run an ESM entry file (`.output/server/index.mjs`). If it only accepts CommonJS, a small `app.cjs` wrapper that does `import()` of the entry file is the usual fix.
3. Where builds happen. Building on a 2 GB shared plan may run out of memory, so the plan is to build in CI and upload `.output/` only. `.output` is self-contained, so no `npm install` is needed on the server.
4. Env var support in the panel, writable paths, logs, and memory limits per process.
5. PostgreSQL availability. cPanel often offers only MySQL/MariaDB. If PostgreSQL is not there, use a managed Postgres (cost to be reviewed) or reconsider the DB choice in Phase 7.
6. TLS, reverse proxy behaviour (`X-Forwarded-*`) and compatibility with Cloudflare in front.

## Decision log

| #   | Decision                                                                                | Why                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | npm as package manager                                                                  | Already installed. cPanel Node tooling assumes npm. One lockfile.                                                                                                         |
| 2   | Tailwind v4 via `@tailwindcss/vite` (not `@nuxtjs/tailwindcss`)                         | This is the official v4 integration and adds one fewer wrapper module. Tokens are defined in CSS `@theme`, so they are also available as CSS variables for GSAP/SVG work. |
| 3   | ESLint stylistic rules off, Prettier owns formatting                                    | Avoids rules that fight each other.                                                                                                                                       |
| 4   | `typescript.typeCheck: false` in dev, `nuxt typecheck` in CI                            | Keeps the dev server fast while strictness is still enforced on every push.                                                                                               |
| 5   | Zod (v4) added in Phase 1                                                               | It is the validation library required by the security spec and is already used for config validation.                                                                     |
| 6   | Noindex by default                                                                      | Previews and staging must never be indexed. Indexing is opt-in, only for production.                                                                                      |
| 7   | Vitest in plain Node env for now                                                        | `@nuxt/test-utils` will be added when component/integration tests exist (no unused deps).                                                                                 |
| 8   | No i18n module yet                                                                      | `@nuxtjs/i18n` comes in Phase 6 (or earlier if Phase 5 copy needs it). Routing will be `/en/`, `/es/`, `/ca/`.                                                            |
| 9   | Fonts via Fontsource packages (not `@nuxt/fonts` or the Google CDN)                     | Files are bundled at build time, so there are no third-party requests (better for GDPR and a simpler CSP) and the build does not need network access.                     |
| 10  | Tokens defined once in CSS `@theme`, mirrored in `shared/design/tokens.ts`              | Tailwind classes and CSS variables come from one place. The TS mirror serves animation code. A test fails if the two drift apart.                                         |
| 11  | Component folders `ui/` (generic) and `decor/` (graphic marks)                          | Nuxt path prefixes give `<UiButton>` and `<DecorStar>`, so where a component comes from is clear at the call site.                                                        |
| 12  | GSAP loaded with `import()` from `app/utils/gsap.ts` (not a Nuxt plugin)                | Keeps about 110 KB of animation code out of the critical path. It is prefetched while the browser is idle and registered once.                                            |
| 13  | `useScrollAnimations` = `gsap.context` + `gsap.matchMedia` scoped to the component root | Selectors are scoped, everything is reverted on unmount, and the breakpoint/reduced-motion branches clean up after themselves.                                            |
| 14  | Canvas scenes are data (`canvas-scenes.ts`), not code                                   | Composition changes don't touch animation logic, and unit tests can check the ranges and mobile rules.                                                                    |
| 15  | Lenis not adopted (for now)                                                             | Native scrolling plus scrubbed ScrollTriggers already feels smooth. Lenis adds touch and anchor edge cases. Revisit after Phase 4 if needed.                              |
| 16  | Content in `app/data/*.ts` (typed) until the DB/CMS exists                              | Swapping placeholders for real assets is a data change, never a component change.                                                                                         |
| 17  | Nested wrappers per artwork (scroll / parallax / float / intro)                         | Each animation owns its own transform, so tweens never conflict.                                                                                                          |
| 18  | Native `<dialog>` for the mobile menu                                                   | The browser provides the focus trap, Escape and inert background, so less custom a11y code.                                                                               |
| 19  | `null` = "not supplied yet" in content models                                           | The UI shows "To be confirmed" instead of inventing values. Tests make sure no sold work is purchasable.                                                                  |
| 20  | Prices in `shared/constants/products.ts` with a publish flag                            | One place, integer cents, server-shareable. Hidden until validated. Moves to the DB/Stripe in Phases 7–8.                                                                 |
| 21  | Newsletter API without a provider returns 503                                           | It never pretends to subscribe someone and never stores PII without a configured, approved provider.                                                                      |
| 22  | Client form without Zod                                                                 | The server is the authority. Light client checks keep Zod out of the browser bundle.                                                                                      |
| 23  | @nuxtjs/i18n, prefix strategy, `customRoutes: 'config'` from `shared/constants/i18n.ts` | One source for locales and localized paths, shared by routing, the sitemap and tests.                                                                                     |
| 24  | Hand-written `/sitemap.xml` and `/robots.txt` server routes (no SEO modules)            | Small, explicit, environment-aware, and no extra dependencies.                                                                                                            |
| 25  | `NUXT_PUBLIC_SITE_URL` copied into i18n `baseUrl` by a pre-plugin                       | One env var for the domain instead of two that could drift apart.                                                                                                         |
| 26  | JSON-LD builders in `shared/utils/structured-data.ts`                                   | Unit-tested rule: unknown facts are omitted. Placeholder titles are never published as data.                                                                              |
| 27  | Drizzle ORM + postgres.js; schema split by domain                                       | Typed SQL with no runtime magic, plain SQL migrations to review, works on any Node host.                                                                                  |
| 28  | Repositories with DB and static implementations                                         | The site works before a DB exists (C3 unresolved), and a test guarantees parity.                                                                                          |
| 29  | PGlite for integration tests (+ optional real-Postgres test)                            | Real Postgres semantics in CI with no Docker. Real concurrency is checked separately against Postgres.                                                                    |
| 30  | Conditional UPDATE for stock + DB CHECK as a second guard                               | Race-safe without explicit locks; overselling is impossible even if code is bypassed.                                                                                     |
| 31  | Seeded offers are inactive                                                              | Hypothesis prices exist in the DB for Phase 8 wiring, but nothing is sellable until the business approves.                                                                |
| 32  | Pages link localized routes by name (`localePath('works')`)                             | Path strings don't translate (`/es/works` is a 404). Enforced by a test.                                                                                                  |
