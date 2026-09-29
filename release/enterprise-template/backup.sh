#!/usr/bin/env bash
# Rooomchi Enterprise — database backup (via Postgres container)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

ENV_FILE="$ROOT/config/.env"
[ -f "$ENV_FILE" ] || { echo "Missing config/.env"; exit 1; }
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

OUT_DIR="${1:-$ROOT/backups}"
mkdir -p "$OUT_DIR"
STAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
FILE="$OUT_DIR/rooomchi_${STAMP}.sql.gz"

echo "[rooomchi-backup] Writing $FILE ..."
docker compose --env-file "$ENV_FILE" exec -T postgres \
  pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB:-rooomchi_db}" | gzip -c > "$FILE"

echo "[rooomchi-backup] Done: $FILE"
