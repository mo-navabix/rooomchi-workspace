#!/usr/bin/env bash
# Rooomchi Enterprise — upgrade in place (new release artifacts in current directory)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

ENV_FILE="$ROOT/config/.env"
[ -f "$ENV_FILE" ] || { echo "Missing config/.env"; exit 1; }

NEW_TAR="${1:-}"
if [ -n "$NEW_TAR" ]; then
  [ -f "$NEW_TAR" ] || { echo "Archive not found: $NEW_TAR"; exit 1; }
  echo "[rooomchi-update] Extracting $NEW_TAR ..."
  TMP="$(mktemp -d)"
  tar -xzf "$NEW_TAR" -C "$TMP"
  SRC="$(find "$TMP" -maxdepth 1 -type d -name 'rooomchi-enterprise-*' | head -1)"
  [ -n "$SRC" ] || { echo "Invalid archive layout"; rm -rf "$TMP"; exit 1; }
  for item in backend frontend database schema schema.sql docker-compose.yml nginx VERSION; do
    if [ -e "$SRC/$item" ]; then
      rm -rf "$ROOT/$item"
      cp -a "$SRC/$item" "$ROOT/$item"
    fi
  done
  rm -rf "$TMP"
  echo "[rooomchi-update] Application files updated (config/ and storage/ preserved)."
fi

echo "[rooomchi-update] Pre-upgrade backup..."
"$ROOT/backup.sh"

echo "[rooomchi-update] Pulling and restarting..."
docker compose --env-file "$ENV_FILE" pull backend frontend
docker compose --env-file "$ENV_FILE" up -d

echo "[rooomchi-update] Waiting for health..."
TRIES=0
# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a
until curl -sf "http://127.0.0.1:${ROOOMCHI_HTTP_PORT:-10808}/health" | grep -q healthy; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -gt 60 ]; then
    echo "Health check failed. Roll back from backups/ if needed."
    exit 1
  fi
  sleep 3
done

echo "[rooomchi-update] Upgrade complete."
