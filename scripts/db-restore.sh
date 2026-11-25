#!/usr/bin/env bash
# Restore a backup into an EMPTY database (restore drills, disaster recovery).
#   TARGET_DATABASE_URL=mysql://user:pass@localhost:3306/restore_test ./scripts/db-restore.sh backups/artsergi-….sql.gz
# Encrypted (.age) files need AGE_IDENTITY=/path/to/key.txt.
# Refuses to touch a database that already has tables.
set -euo pipefail
FILE="${1:?usage: db-restore.sh <backup file>}"
: "${TARGET_DATABASE_URL:?TARGET_DATABASE_URL is required}"
umask 077
DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=scripts/db-url.sh
. "$DIR/db-url.sh"
parse_db_url "$TARGET_DATABASE_URL"

TABLES="$(mysql --defaults-extra-file="$DB_CNF" -N -B -e \
  "select count(*) from information_schema.tables where table_schema = '$DB_NAME'")"
if [ "$TABLES" != "0" ]; then
  echo "refusing: target database is not empty ($TABLES tables)" >&2
  exit 1
fi

if [ -f "$FILE.sha256" ] && command -v sha256sum > /dev/null; then
  (cd "$(dirname "$FILE")" && sha256sum -c "$(basename "$FILE").sha256")
fi

case "$FILE" in
  *.age)
    : "${AGE_IDENTITY:?AGE_IDENTITY is required for encrypted backups}"
    age --decrypt --identity "$AGE_IDENTITY" "$FILE" | gzip -dc | mysql --defaults-extra-file="$DB_CNF" "$DB_NAME"
    ;;
  *) gzip -dc "$FILE" | mysql --defaults-extra-file="$DB_CNF" "$DB_NAME" ;;
esac
echo "restore ok into $DB_NAME"
