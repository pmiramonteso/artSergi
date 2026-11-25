# Deployment: Sered cPanel (Node.js App) + optional Cloudflare

Status: **prepared, not executed.** It needs the hosting checks in OPEN_QUESTIONS C1–C3 and the business decisions before going live.

## 1. Pre-flight checklist (hosting)

| Check                                                                              | Why                                                   |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| cPanel → Setup Node.js App offers **Node 24** (min 22.22.3)                        | Nuxt 4.7 engine requirement                           |
| An app can use a **CommonJS startup file** (`server.cjs`) and runs under Passenger | `server.cjs` loads the ESM server                     |
| **SSH access** (for the release workflow) or at least SFTP                         | Upload releases, switch symlink, restart              |
| **MySQL 8.4** database in the same account (Sered: ✅ MySQL 8.4.9)                 | Accounts, orders, content                             |
| Memory per process ≥ 512 MB                                                        | The Node server uses ~120–200 MB; headroom for spikes |
| HTTPS certificate (AutoSSL / Let's Encrypt) on the final domain                    | HSTS, secure cookies                                  |

## 1b. Database (cPanel → MySQL)

1. **Bases de datos → Asistente de base de datos** (Database Wizard):
   - database `artsergi` → cPanel names it `<cpaneluser>_artsergi`;
   - user `app` → `<cpaneluser>_app`, with a long generated password;
   - privileges: **ALL PRIVILEGES** on that database only (the app creates its tables through migrations).
2. `NUXT_DATABASE_URL=mysql://<cpaneluser>_app:<password>@localhost:3306/<cpaneluser>_artsergi`. In the password, encode `@ : / ? # %` as `%40 %3A %2F %3F %23 %25`, or generate one with letters and digits only.
3. First start: `NUXT_DB_MIGRATE_ON_START=true` creates the tables and `NUXT_DB_SEED_ON_START=true` loads the initial content (only into an empty database, so it never overwrites admin edits). Afterwards set the migrate flag back to `false`.
4. Never expose MySQL publicly: leave **Acceso remoto a bases de datos** (Remote MySQL) empty. The app connects through `localhost`.

## 2. Server layout (atomic releases)

```
~/apps/artsergi/
  releases/<git-sha>/        each release: .output/, server.cjs, package.json, tmp/
  current -> releases/<sha>  symlink; the cPanel "Application root" points HERE
```

In **Setup Node.js App**: Node 24 · Application mode _Production_ · Application root `apps/artsergi/current` · Startup file `server.cjs` · plus the environment variables below.

Passenger restarts the app when `current/tmp/restart.txt` is touched (the release workflow does this).

## 3. Environment variables (production)

Set them in the cPanel app settings. Never commit them. Generate secrets with `openssl rand -base64 48`.

| Variable                                               | Value                                                                                                                                   |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                             | `production`                                                                                                                            |
| `NUXT_PUBLIC_SITE_URL`                                 | `https://<final-domain>` (B8)                                                                                                           |
| `NUXT_PUBLIC_SITE_INDEXABLE`                           | `true` only for the real launch                                                                                                         |
| `NUXT_DATABASE_URL`                                    | `mysql://<user>:<password>@localhost:3306/<database>` (cPanel prefixes names with the account user; URL-encode symbols in the password) |
| `NUXT_AUTH_SECRET`                                     | ≥ 32 random characters                                                                                                                  |
| `NUXT_SMTP_URL`, `NUXT_MAIL_FROM`                      | transactional email (B6)                                                                                                                |
| `NUXT_ADMIN_EMAILS`                                    | admin email(s) (B17)                                                                                                                    |
| `NUXT_CLIENT_IP_HEADER`                                | `cf-connecting-ip` behind Cloudflare, else the host proxy's header                                                                      |
| `NUXT_COMMERCE_MODE`, `NUXT_PUBLIC_COMMERCE_MODE`      | `off` until approved; `test` for staging                                                                                                |
| `NUXT_STRIPE_SECRET_KEY`, `NUXT_STRIPE_WEBHOOK_SECRET` | only when commerce is on                                                                                                                |
| `NUXT_UPLOADS_DIR`                                     | Persistent folder for admin-uploaded photos, **outside** `releases/`, e.g. `/home/<user>/apps/artsergi/uploads`. Include it in backups  |
| `NUXT_DB_MIGRATE_ON_START`                             | `true` **only** for a release that adds migrations, then back to `false`                                                                |
| `NUXT_DB_SEED_ON_START`                                | `true` for the first install: loads initial content only if the database is empty                                                       |

At startup the server runs a **config audit**. It logs warnings and refuses to start on unsafe settings: an indexable non-https site, or a weak auth secret.

> **Vercel previews** can't keep uploaded photos (read-only, ephemeral filesystem; request bodies are limited to 4.5 MB). Uploads are meant for the cPanel production server. If you ever host on serverless, switch uploads to object storage (S3/R2/Vercel Blob).

## 4. Releasing

1. GitHub → Actions → **Release** → _Run workflow_. This runs the full check suite and the production dependency audit, then builds `release-<sha>.tar.gz` plus a checksum (kept 90 days).
2. To deploy, tick **deploy**. The `production` environment must require a reviewer's approval. The job verifies the checksum, uploads over SSH with a pinned host key, switches `current` atomically, restarts Passenger and smoke-tests `/api/health/ready`.
   - Secrets: `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`. Variable: `SITE_URL`.
3. **Manual alternative (no SSH):** download the artifact, upload and extract it to `releases/<sha>/` via the cPanel File Manager, repoint `current` (or the app root) and press _Restart_ in Setup Node.js App.

### Database migrations

- **Before** any release with new migrations, take a backup (OPERATIONS.md).
- Set `NUXT_DB_MIGRATE_ON_START=true`, restart, check the log for `migrations applied`, then set it back to `false`.
- Migrations are forward-only and must stay compatible with the previous release (expand → deploy → contract), so rolling back the code never needs a DB rollback.
- Alternative from a trusted machine: `NUXT_DATABASE_URL=… npm run db:migrate`.

## 5. Stripe (when commerce is approved)

- Webhook endpoint: `https://<domain>/api/webhooks/stripe`. Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `customer.subscription.created|updated|deleted`, `charge.refunded`.
- Customer Portal: configure it in the Stripe Dashboard (allowed actions: cancel, update payment method, invoices).
- Live mode additionally requires `PRICING_PUBLISHED = true` in `shared/constants/products.ts` (a code change, reviewed) and active products.

## 6. Cloudflare (optional, recommended)

Cloudflare does not secure the app by itself. The app keeps all its own controls.

- DNS proxied (orange cloud), **SSL/TLS: Full (strict)**, Always Use HTTPS, minimum TLS 1.2.
- **Cache:** bypass for `/api/*`, `/admin*`, `/*/account*`, `/*/checkout*`. HTML responses already send `Cache-Control: private, no-cache`. Cache `/_nuxt/*`, `/images/*` and `/fonts` aggressively (fingerprinted).
- **WAF:** managed rules on. Rate-limit rules for `/api/auth/*` (e.g. 20 req/min/IP), `/api/checkout` (10/min) and `/api/newsletter` (5/min), on top of the app's own DB-backed limits.
- Set `NUXT_CLIENT_IP_HEADER=cf-connecting-ip`, and ideally restrict the origin to Cloudflare IPs at the host.
- Bot Fight Mode: test that it does not block Stripe webhooks (or skip the webhook path).
