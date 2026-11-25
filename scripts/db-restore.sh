#!/bin/sh
# Restore a backup into an EMPTY database (restore drills, disaster recovery).
#   TARGET_DATABASE_URL=postgres://…/restore_test ./scripts/db-restore.sh backups/artsergi-….dump
# Encrypted (.age) files need AGE_IDENTITY=/path/to/key.txt.
# Refuses to touch a database that already has tables.
set -eu
FILE="${1:?usage: db-restore.sh <backup file>}"
: "${TARGET_DATABASE_URL:?TARGET_DATABASE_URL is required}"

TABLES="$(psql "$TARGET_DATABASE_URL" -tAc "select count(*) from information_schema.tables where table_schema='public'")"
if [ "$TABLES" != "0" ]; then
  echo "refusing: target database is not empty ($TABLES tables)" >&2
  exit 1
fi

if [ -f "$FILE.sha256" ] && command -v sha256sum > /dev/null; then sha256sum -c "$FILE.sha256"; fi

case "$FILE" in
  *.age)
    : "${AGE_IDENTITY:?AGE_IDENTITY is required for encrypted backups}"
    TMP="$(mktemp)"
    trap 'rm -f "$TMP"' EXIT
    age --decrypt --identity "$AGE_IDENTITY" --output "$TMP" "$FILE"
    SRC="$TMP"
    ;;
  *) SRC="$FILE" ;;
esac

pg_restore --no-owner --no-privileges --exit-on-error --dbname="$TARGET_DATABASE_URL" "$SRC"
echo "restore ok into target database"
