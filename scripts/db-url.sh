# Sourced by db-backup.sh / db-restore.sh (bash).
# parse_db_url mysql://user:pass@host:port/db → DB_NAME and DB_CNF (a private
# temporary [client] option file, removed on exit). Percent-encoding in the
# user and password (e.g. %40 for @) is decoded.
urldecode() {
  printf '%b' "$(printf '%s' "$1" | sed -e 's/%\([0-9A-Fa-f][0-9A-Fa-f]\)/\\x\1/g')"
}

parse_db_url() {
  local url="$1" rest creds hostport
  case "$url" in mysql://*) ;; *) echo "DATABASE_URL must start with mysql://" >&2; exit 1 ;; esac
  rest="${url#mysql://}"
  creds="${rest%%@*}"
  rest="${rest#*@}"
  hostport="${rest%%/*}"
  DB_NAME="$(urldecode "${rest#*/}")"
  DB_NAME="${DB_NAME%%\?*}"
  DB_CNF="$(mktemp)"
  trap 'rm -f "$DB_CNF"' EXIT
  {
    echo "[client]"
    echo "user=\"$(urldecode "${creds%%:*}")\""
    echo "password=\"$(urldecode "${creds#*:}")\""
    echo "host=${hostport%%:*}"
    if [ "$hostport" != "${hostport#*:}" ]; then echo "port=${hostport#*:}"; fi
    echo "default-character-set=utf8mb4"
  } > "$DB_CNF"
}
