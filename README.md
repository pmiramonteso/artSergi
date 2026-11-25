# Sergi Tugas Art Studio

Artist portfolio, Art Mail Club and art shop. Built with Nuxt 4, TypeScript (strict) and Tailwind CSS v4.

## Requirements

- Node.js `^22.22.3 || ^24.15.0 || >=26` (see `.nvmrc`)
- npm

## Setup

```bash
npm install
cp .env.example .env   # optional for local dev
npm run dev            # http://localhost:3000
```

## Scripts

| Script                                | Purpose                                                            |
| ------------------------------------- | ------------------------------------------------------------------ |
| `npm run dev`                         | Dev server                                                         |
| `npm run build`                       | Production build → `.output/`                                      |
| `npm start`                           | Run the built server (`node .output/server/index.mjs`)             |
| `npm run lint` / `lint:fix`           | ESLint                                                             |
| `npm run format` / `format:check`     | Prettier                                                           |
| `npm run typecheck`                   | `vue-tsc` via `nuxt typecheck`                                     |
| `npm test`                            | Vitest unit tests                                                  |
| `npm run check`                       | Everything CI runs                                                 |
| `npm run test:e2e`                    | Playwright E2E on the production build (run `npm run build` first) |
| `npm run images` / `lettering` / `og` | Rebuild web images / signature SVG / share image                   |

## Docs

- [PROJECT_STATUS.md](PROJECT_STATUS.md): current phase, tasks, known issues
- [ARCHITECTURE.md](ARCHITECTURE.md): structure, hosting, decision log
- [SECURITY.md](SECURITY.md): security controls and roadmap
- [ASSET_GUIDELINES.md](ASSET_GUIDELINES.md): how the artist provides images and files
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md): admin panel guide for the artist (Spanish)
- [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md): everything still pending from the artist, the business and hosting
- [DEPLOYMENT.md](DEPLOYMENT.md): cPanel/Cloudflare deployment, environment variables, releases
- [OPERATIONS.md](OPERATIONS.md): monitoring, backups, rollback, incidents

## Testing payments locally (Stripe TEST mode)

No real money is involved. You need a free Stripe account, Docker (for MySQL) and the [Stripe CLI](https://docs.stripe.com/stripe-cli).

1. `docker compose up -d`, then put `NUXT_DATABASE_URL=mysql://artsergi:artsergi@127.0.0.1:3306/artsergi` in `.env`. Integration tests need `TEST_MYSQL_URL=mysql://root:artsergi@127.0.0.1:3306`.
2. `npm run db:migrate`, then start `npm run dev` and run `npm run db:seed` in another terminal.
3. Stripe Dashboard (Test mode) → Developers → API keys: copy the **secret test key** (`sk_test_…`) into `.env` as `NUXT_STRIPE_SECRET_KEY`. Never paste it in chats or commit it.
4. `stripe login`, then `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. Copy the printed `whsec_…` into `NUXT_STRIPE_WEBHOOK_SECRET`.
5. Set `NUXT_COMMERCE_MODE=test` and `NUXT_PUBLIC_COMMERCE_MODE=test`, then restart `npm run dev`.
6. Open `/es#collection` → Comprar → pay with card **4242 4242 4242 4242**, any future date, any CVC.
