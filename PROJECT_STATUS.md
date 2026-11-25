# Project Status — Sergi Tugas Art Studio

_Last updated: 2026-11-25_

## Current phase

**Phase 3 — Living Canvas: complete, merged to `main`.**
Next phase: Phase 4 (Artist hero). It needs the artist's assets (see below).

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

## Pending (owner)

- [ ] Confirm Vercel is connected and preview deployments build (check the Hobby plan terms before any commercial use)
- [ ] Turn on branch protection on `main` so CI must pass before merging
- [ ] Check the Sered cPanel account: Node version, Node.js App Manager, env vars, PostgreSQL availability

## Known issues

- `npm audit` reports 9 **moderate** advisories, all from one root cause: `minimatch` (ReDoS, GHSA-g3hv-75wg-m249) pulled in through `nitropack → archiver → readdir-glob`. This is build-time tooling, not the request path. The suggested "fix" downgrades Nuxt, so it is not applied. CI fails only on high or critical advisories. Re-check when Nuxt/Nitro update.
- npm 11 shows a warning that the `esbuild` postinstall script is not approved. The build works anyway because the platform binary comes from an optional dependency.
- The inline intro script will need a CSP hash or nonce when the CSP lands (Phase 6/10).
- Scene transitions assume each section is at least ~70% of the viewport tall (the trigger range is 85% → 15%). Shorter sections would overlap transitions. Revisit when the real sections exist (Phase 5).
- `public/robots.txt` is the scaffold default (allow all). Phase 6 will replace it with a generated, environment-aware version. Until then the noindex header keeps previews out of search engines.

## Technical decisions

See ARCHITECTURE.md → "Decision log".

## Next actions

1. Owner reviews Phase 3 locally: scroll the homepage on desktop and mobile.
2. **Blocking for Phase 4:** the three painting photographs and Sergi's handwritten lettering (scan). Until they arrive, Phase 4 can only use labeled placeholders.
3. Phase 4: header, lettering, three floating artworks, hero GSAP timeline, pointer parallax (`usePointerParallax`, `useHeroAnimation`) and the hero → Selected Works transition.
