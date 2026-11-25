#!/usr/bin/env bash
# MySQL 8.4 backup. Run daily from cron (cPanel → Cron Jobs) or a trusted machine.
#   DATABASE_URL=mysql://user:pass@localhost:3306/db BACKUP_DIR=$HOME/backups ./scripts/db-backup.sh
# Optional: BACKUP_AGE_RECIPIENT=age1… encrypts each dump with `age`
# (https://age-encryption.org) before it leaves this machine.
# Retention: BACKUP_KEEP_DAYS (default 30). Never commit backups.
# The password goes into a private temporary option file, never on the
# command line (where other users of the server could see it).
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL is required}"
OUT_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-30}"
umask 077
mkdir -p "$OUT_DIR"
DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=scripts/db-url.sh
. "$DIR/db-url.sh"
parse_db_url "$DATABASE_URL"

TS="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$OUT_DIR/artsergi-$TS.sql.gz"

# --single-transaction: consistent snapshot without locking the shop.
# --no-tablespaces: shared-hosting users have no PROCESS privilege.
mysqldump --defaults-extra-file="$DB_CNF" --single-transaction --quick --routines --triggers \
  --no-tablespaces --set-gtid-purged=OFF --hex-blob --default-character-set=utf8mb4 \
  "$DB_NAME" | gzip -9 > "$FILE"

# Integrity check: valid gzip and a complete dump.
gzip -t "$FILE"
gzip -dc "$FILE" | tail -n 1 | grep -q '^-- Dump completed' || { echo "incomplete dump" >&2; exit 1; }

if [ -n "${BACKUP_AGE_RECIPIENT:-}" ]; then
  age --recipient "$BACKUP_AGE_RECIPIENT" --output "$FILE.age" "$FILE"
  rm -f "$FILE"
  FILE="$FILE.age"
fi

if command -v sha256sum > /dev/null; then sha256sum "$FILE" > "$FILE.sha256"; fi
find "$OUT_DIR" -name 'artsergi-*' -type f -mtime +"$KEEP_DAYS" -exec rm -f {} \;
echo "backup ok: $FILE"
