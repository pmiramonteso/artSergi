# Architecture — Sergi Tugas Art Studio

One Nuxt 4 application (SSR, Nitro server) serves all three business areas: the portfolio, the Art Mail Club and the shop. It is deliberately a modular monolith with no microservices.

## Current layout (Phase 1)

```
app/                  Vue application (Nuxt 4 srcDir)
  app.vue             Root: route announcer + layout + page
  error.vue           Error / 404 page
  layouts/default.vue
  pages/index.vue     Temporary placeholder homepage
  assets/css/main.css Tailwind entry + theme tokens
server/               Nitro server (business logic lives here, never in components)
  api/health.get.ts
  middleware/robots-header.ts
shared/               Code shared by app/ and server/ (auto-imported in both)
  utils/site-url.ts
tests/unit/           Vitest (pure logic)
public/               Static files served as-is
```

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
