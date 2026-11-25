#!/bin/sh
# PostgreSQL backup (POSIX sh). Run daily from cron on a trusted machine.
#   DATABASE_URL=postgres://… BACKUP_DIR=/secure/backups ./scripts/db-backup.sh
# Optional: BACKUP_AGE_RECIPIENT=age1… encrypts each dump with `age`
# (https://age-encryption.org) before it leaves this machine.
# Retention: BACKUP_KEEP_DAYS (default 30). Never commit backups.
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
OUT_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-30}"
mkdir -p "$OUT_DIR"
umask 077
TS="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$OUT_DIR/artsergi-$TS.dump"

pg_dump --format=custom --no-owner --no-privileges --dbname="$DATABASE_URL" --file="$FILE"
# Integrity check: the archive must be readable.
pg_restore --list "$FILE" > /dev/null

if [ -n "${BACKUP_AGE_RECIPIENT:-}" ]; then
  age --recipient "$BACKUP_AGE_RECIPIENT" --output "$FILE.age" "$FILE"
  rm -f "$FILE"
  FILE="$FILE.age"
fi

if command -v sha256sum > /dev/null; then sha256sum "$FILE" > "$FILE.sha256"; fi
find "$OUT_DIR" -name 'artsergi-*' -type f -mtime +"$KEEP_DAYS" -exec rm -f {} \;
echo "backup ok: $FILE"
