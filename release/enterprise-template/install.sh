#!/usr/bin/env bash
# Rooomchi Enterprise — first-time install
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

ENV_FILE="$ROOT/config/.env"
ENV_EXAMPLE="$ROOT/config/.env.example"

log() { printf '[rooomchi-install] %s\n' "$*"; }
die() { log "ERROR: $*"; exit 1; }

command -v docker >/dev/null 2>&1 || die "Docker is required."
docker compose version >/dev/null 2>&1 || die "Docker Compose v2 is required."

if [ ! -f "$ENV_FILE" ]; then
  log "Creating config/.env from template..."
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  if command -v openssl >/dev/null 2>&1; then
    JWT="$(openssl rand -base64 48 | tr -d '\n/+=' | head -c 48)"
    sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=${JWT}|" "$ENV_FILE" 2>/dev/null || \
      sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=${JWT}|" "$ENV_FILE" 2>/dev/null || true
    rm -f "$ENV_FILE.bak"
    log "Generated JWT_SECRET in config/.env"
  fi
  log "Edit config/.env (APP_URL, POSTGRES_PASSWORD) then run install.sh again."
  exit 0
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

if [ "${JWT_SECRET:-}" = "CHANGE_ME_MIN_32_RANDOM_CHARS________________" ] || [ ${#JWT_SECRET} -lt 32 ]; then
  die "Set JWT_SECRET (min 32 chars) in config/.env"
fi
if [ "${POSTGRES_PASSWORD:-}" = "CHANGE_ME_STRONG_PASSWORD" ] || [ -z "${POSTGRES_PASSWORD:-}" ]; then
  die "Set POSTGRES_PASSWORD in config/.env"
fi

if [ ! -f "$ROOT/config/license.json" ] && [ -f "$ROOT/config/license.json.example" ]; then
  cp "$ROOT/config/license.json.example" "$ROOT/config/license.json"
  log "Created config/license.json from example (optional for on-prem)."
fi

mkdir -p "$ROOT/storage/uploads" "$ROOT/backups"

log "Building and starting containers..."
docker compose --env-file "$ENV_FILE" up -d --build

log "Waiting for API health..."
TRIES=0
until curl -sf "http://127.0.0.1:${ROOOMCHI_HTTP_PORT:-80}/health" | grep -q healthy; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -gt 60 ]; then
    die "Backend did not become healthy. Check: docker compose logs backend"
  fi
  sleep 3
done

log "Install complete."
log "Open: ${APP_URL:-http://localhost}/install"
log "Complete the setup wizard (organization + admin user)."
