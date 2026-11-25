# Operations runbook

## Monitoring

| What                      | How                                                                                                                                                   | Cost                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Uptime                    | Uptime monitor on `GET /api/health/ready` (200 `{"status":"ok"}`; 503 if the DB is down), every 5 min, alerts by email                                | Free tiers exist (e.g. UptimeRobot) |
| Errors                    | Server logs (cPanel → Node.js App log / `stderr`): 5xx are logged as JSON lines with `level`, `status`, `method`, `path`, `message`. No personal data | Included                            |
| Config                    | Startup log lines `[config] …` from the config audit                                                                                                  | Included                            |
| Payments                  | Stripe Dashboard → Developers → Webhooks: failed deliveries. Admin panel: orders stuck in `awaiting_payment`                                          | Included                            |
| Web vitals                | PageSpeed Insights / Search Console after launch (targets: LCP < 2.5 s, INP < 200 ms, CLS < 0.1)                                                      | Free                                |
| Error tracking (optional) | Sentry or similar. Not installed: decide on cost and privacy first                                                                                    | Paid above free tier                |

## Backups

- **What:** the PostgreSQL database (orders, customers, accounts, content). Code and images live in git. Original artwork files must also be kept outside the server (artist's own archive).
- **How:** `scripts/db-backup.sh` (pg_dump custom format, integrity check, sha256, optional `age` encryption, retention `BACKUP_KEEP_DAYS`, default 30).
- **Schedule:** daily via cron on a trusted machine (or the host's cron if `pg_dump` is available):
  ```
  15 3 * * *  DATABASE_URL=… BACKUP_DIR=/secure/backups BACKUP_AGE_RECIPIENT=age1… /path/scripts/db-backup.sh
  ```
- **Storage:** encrypted, off the hosting account (C6), at least 2 copies in different places. The `age` private key is stored separately from the backups.
- **Retention:** 30 daily + 12 monthly (keep one per month). Align with the legal retention for accounting (B18).
- **Restore drill (quarterly, and after schema changes):**
  ```
  createdb restore_drill
  TARGET_DATABASE_URL=postgres://…/restore_drill ./scripts/db-restore.sh backups/artsergi-<ts>.dump
  ```
  Compare row counts for orders, payments, subscriptions, artworks and users, then drop the drill database. The restore script refuses non-empty targets.
  - Verified on 2026-11-25 against PostgreSQL 17: all 27 tables restored with identical counts; the refusal on a non-empty target works.

## Rollback

1. **Code:** point `current` back to the previous `releases/<sha>`, then touch `current/tmp/restart.txt` (or _Restart_ in cPanel):
   ```
   ln -sfn ~/apps/artsergi/releases/<previous-sha> ~/apps/artsergi/current.tmp && mv -T ~/apps/artsergi/current.tmp ~/apps/artsergi/current
   touch ~/apps/artsergi/current/tmp/restart.txt
   ```
   Keep the last 5 releases and delete older ones manually.
2. **Database:** migrations are backward compatible, so a code rollback needs no DB change. Only if data is damaged: restore the pre-deploy backup into a new database, check it, then switch `NUXT_DATABASE_URL`.
3. **Payments:** if checkout misbehaves, set `NUXT_COMMERCE_MODE=off` (and the public one) and restart. Checkout is then disabled immediately and webhooks keep being verified.

## Incident checklist

1. Check `/api/health/ready`, the app log and the Stripe webhook log.
2. Suspected compromise:
   - Rotate `NUXT_AUTH_SECRET` (signs everyone out), the Stripe keys and the webhook secret, the DB password and SMTP credentials.
   - Review `admin_audit_logs`.
   - Revoke sessions (`delete from sessions;`).
3. Personal-data breach: document it, and assess whether the authority and the affected users must be notified within 72 h (GDPR art. 33/34). Legal advice (B4/B5).
4. Write a short post-mortem in the repo (`docs/incidents/`).

## Routine

- **Weekly:** review and merge Dependabot PRs (CI must pass).
- **Monthly:** `npm audit`; check failed webhooks and `awaiting_payment` orders older than 1 h (stock is released automatically after 35 min).
- **Quarterly:** restore drill, review admin accounts and 2FA, rotate the Stripe webhook secret if staff changed.
