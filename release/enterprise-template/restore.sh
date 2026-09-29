#!/usr/bin/env bash
# Rooomchi Enterprise — restore database from gzip dump
# WARNING: overwrites current database data.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

BACKUP_FILE="${1:?Usage: ./restore.sh path/to/rooomchi_YYYYMMDD.sql.gz}"
[ -f "$BACKUP_FILE" ] || { echo "File not found: $BACKUP_FILE"; exit 1; }

ENV_FILE="$ROOT/config/.env"
[ -f "$ENV_FILE" ] || { echo "Missing config/.env"; exit 1; }
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

read -r -p "This will REPLACE all data in ${POSTGRES_DB}. Continue? [y/N] " ans
case "$ans" in
  y|Y|yes|YES) ;;
  *) echo "Aborted."; exit 1 ;;
esac

echo "[rooomchi-restore] Stopping backend..."
docker compose --env-file "$ENV_FILE" stop backend

echo "[rooomchi-restore] Restoring..."
gunzip -c "$BACKUP_FILE" | docker compose --env-file "$ENV_FILE" exec -T postgres \
  psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB:-rooomchi_db}" -v ON_ERROR_STOP=1

echo "[rooomchi-restore] Starting backend..."
docker compose --env-file "$ENV_FILE" start backend
echo "[rooomchi-restore] Done."
