# Open questions and pending inputs

Everything the site still needs from **Sergi** (content), the **business** (decisions), or **hosting/infrastructure** before launch. Updated every phase. When an item is resolved, move it to "Resolved" with the date and the answer.

Legend: 🔴 blocks launch · 🟠 blocks a specific feature · 🟢 nice to have

---

## A. Content from Sergi

| #   | Item                                                                                                                                                                                                                                                                                 | Needed for                                | Status | Where it goes                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | ------ | ------------------------------------------- |
| A1  | **Partly done (2026-11-25):** the 3 paintings were received (WhatsApp, ~900×1024 px) and are live. Still needed: high-resolution originals (frontal, accurate colour, no reflections). Then drop them into `assets-src/artworks/<slug>/original.*` and run `npm run images:artworks` | Sharpness on large screens / detail pages | 🟠     | `assets-src/artworks/`                      |
| A2  | For each painting: title, year, medium, dimensions (cm), short description (EN, plus ES/CA if wanted)                                                                                                                                                                                | Works pages, structured data              | 🔴     | `app/data/artworks.ts` (later: DB)          |
| A3  | Handwritten "Sergi Tugas" lettering (600 dpi scan or SVG)                                                                                                                                                                                                                            | Hero, header, footer                      | 🔴     | `public/illustrations/lettering/`           |
| A4  | Portrait and/or studio photo                                                                                                                                                                                                                                                         | Artist introduction                       | 🟠     | `public/images/artist/`                     |
| A5  | Approved artist statement (the current quote is a placeholder from the brief)                                                                                                                                                                                                        | Artist introduction                       | 🔴     | i18n messages                               |
| A6  | Short biography                                                                                                                                                                                                                                                                      | Artist introduction, About                | 🔴     | i18n messages                               |
| A7  | Studio process photos (painting, brushes, sketches, WIP, printing, packing)                                                                                                                                                                                                          | Studio section                            | 🟠     | `public/images/artist/studio/`              |
| A8  | Places We Keep Nº 001 artwork: main illustration, postcard, 3 stickers, story card, collector detail, envelope/seal                                                                                                                                                                  | Collection + Art Mail sections            | 🔴     | `public/images/collections/places-we-keep/` |
| A9  | Doodles / graphic marks drawn by Sergi (scans) to replace the generic system marks                                                                                                                                                                                                   | Living Canvas, hero                       | 🟢     | `public/illustrations/doodles/`             |
| A10 | Review of ES and CA translations (written by Claude, not yet checked by a native speaker)                                                                                                                                                                                            | Multilingual site                         | 🟠     | `i18n/locales/*.json`                       |
| A11 | Social sharing image (1200×630), ideally from a real artwork                                                                                                                                                                                                                         | Open Graph / social previews              | 🟠     | `public/og/`                                |

## B. Business decisions

| #   | Decision                                                                                                                                             | Blocks                                  | Status |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------ |
| B1  | Final name for the "Art Mail Club" (working name)                                                                                                    | Branding, copy, possible domain         | 🔴     |
| B2  | Validate prices (hypothesis: €8.90/month, €9.90 single, €26.70 3-month gift, €99 annual) → then set `PRICING_PUBLISHED`                              | Showing prices, checkout                | 🔴     |
| B3  | Shipping: destinations, carriers, rates, delivery promises                                                                                           | Checkout (Phase 8)                      | 🔴     |
| B4  | Legal entity and tax setup (self-employed vs company, VAT/OSS for EU sales)                                                                          | Checkout, invoices, Organization schema | 🔴     |
| B5  | Legal texts: privacy, cookies, terms, shipping & returns (written by the business or its advisor)                                                    | Launch, newsletter                      | 🔴     |
| B6  | Newsletter provider (e.g. own DB + mailer, Brevo, Mailchimp…), privacy review, double opt-in                                                         | Opening newsletter sign-up              | 🟠     |
| B7  | Annual Original: how it works (must not be a lottery/giveaway without an approved legal structure)                                                   | Annual section content                  | 🟠     |
| B8  | Final domain (and whether Art Mail Club gets its own domain later)                                                                                   | Canonicals, sitemap, email              | 🔴     |
| B9  | Public contact email and social profiles                                                                                                             | Footer, Person schema                   | 🟠     |
| B10 | Default language and whether `/` should auto-redirect by browser language (currently: yes, falls back to EN)                                         | i18n                                    | 🟢     |
| B11 | Whether the 3-month gift is prepaid or a recurring subscription with an end date                                                                     | Stripe Billing (Phase 8)                | 🟠     |
| B13 | Cookie policy must list the functional cookie `i18n_locale` (remembers the chosen language, 1 year). No analytics or marketing cookies are set today | Cookie policy (B5)                      | 🟠     |
| B14 | Should legal page URLs be localized (e.g. `/es/legal/privacidad`)?                                                                                   | SEO polish                              | 🟢     |
| B12 | Annual collector product contents (€99, "subject to validation")                                                                                     | Product catalogue                       | 🟠     |

## C. Hosting and infrastructure

| #   | Item                                                                                                       | Blocks                   | Status |
| --- | ---------------------------------------------------------------------------------------------------------- | ------------------------ | ------ |
| C1  | Sered cPanel: Node version available (needs ≥ 22.22.3, ideally 24 LTS)                                     | Production deploy        | 🔴     |
| C2  | Sered cPanel: does the Node.js App Manager run an ESM entry? Memory limits per process?                    | Production deploy        | 🔴     |
| C3  | **PostgreSQL**: is it available on Sered Plan M? If not, which managed Postgres (cost)?                    | Production DB (Phase 7+) | 🔴     |
| C4  | Vercel plan: Hobby is non-commercial. Use it only for previews, or upgrade?                                | Commercial previews      | 🟠     |
| C5  | Cloudflare in front (DNS/WAF/rate limiting)? Account owner?                                                | Security hardening       | 🟢     |
| C6  | Backup destination for DB dumps (off-site, encrypted)                                                      | Phase 10                 | 🟠     |
| C8  | Production migration procedure: who runs `db:migrate`, from where (CI with a secret, or a trusted laptop)? | Phase 10                 | 🟠     |
| C7  | Branch protection on `main` (CI required before merge)                                                     | Process                  | 🟢     |

---

## Resolved

| Date       | Item                          | Answer                                                                |
| ---------- | ----------------------------- | --------------------------------------------------------------------- |
| 2026-11-25 | Git identity for commits      | GitHub noreply email of the owner's account                           |
| 2026-11-25 | Vercel connected for previews | Owner confirmed by email (check the plan terms before commercial use) |
