# Project Status — Sergi Tugas Art Studio

_Last updated: 2026-11-25_

## Current phase

**Phase 2 — Design system: complete, merged to `main`.**
Next phase: Phase 3 (Living Canvas). It needs approval first.

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

## Pending (owner)

- [ ] Confirm Vercel is connected and preview deployments build (check the Hobby plan terms before any commercial use)
- [ ] Turn on branch protection on `main` so CI must pass before merging
- [ ] Check the Sered cPanel account: Node version, Node.js App Manager, env vars, PostgreSQL availability

## Known issues

- `npm audit` reports 9 **moderate** advisories, all from one root cause: `minimatch` (ReDoS, GHSA-g3hv-75wg-m249) pulled in through `nitropack → archiver → readdir-glob`. This is build-time tooling, not the request path. The suggested "fix" downgrades Nuxt, so it is not applied. CI fails only on high or critical advisories. Re-check when Nuxt/Nitro update.
- npm 11 shows a warning that the `esbuild` postinstall script is not approved. The build works anyway because the platform binary comes from an optional dependency.
- `public/robots.txt` is the scaffold default (allow all). Phase 6 will replace it with a generated, environment-aware version. Until then the noindex header keeps previews out of search engines.

## Technical decisions

See ARCHITECTURE.md → "Decision log".

## Next actions

1. Owner reviews Phase 2 locally (`/` and `/design-system`).
2. Sergi: send the three painting photos, the handwritten lettering and the doodles (see ASSET_GUIDELINES.md). These are needed for Phases 3–4.
3. Phase 3: Living Canvas (layered background, scroll transitions). This adds GSAP.
