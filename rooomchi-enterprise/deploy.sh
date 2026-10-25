#!/usr/bin/env bash
# Rooomchi Enterprise — pull GHCR images and start/update stack (no volume deletion)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

ENV_FILE="$ROOT/config/.env"
ENV_EXAMPLE="$ROOT/config/.env.example"
COMPOSE=(docker compose --env-file "$ENV_FILE")

log() { printf '[rooomchi-deploy] %s\n' "$*"; }
die() { log "ERROR: $*"; exit 1; }

command -v docker >/dev/null 2>&1 || die "Docker is not installed."
docker compose version >/dev/null 2>&1 || die "Docker Compose v2 is required."

if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$ENV_EXAMPLE" ]; then
    log "config/.env not found — copy config/.env.example to config/.env and edit secrets."
  fi
  die "Missing config/.env"
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

require_var() {
  local name="$1"
  local val="${!name:-}"
  if [ -z "$val" ]; then
    die "Required variable $name is not set in config/.env"
  fi
  case "$val" in
    CHANGE_ME*|change_me*) die "Set a real value for $name in config/.env" ;;
  esac
}

require_var POSTGRES_USER
require_var POSTGRES_PASSWORD
require_var JWT_SECRET
require_var APP_URL
require_var IMAGE_GHCR_BACKEND
require_var IMAGE_GHCR_FRONTEND

if [ "${#JWT_SECRET}" -lt 32 ]; then
  die "JWT_SECRET must be at least 32 characters"
fi

for f in docker-compose.yml nginx/nginx.conf; do
  [ -f "$ROOT/$f" ] || die "Missing $f"
done

mkdir -p "$ROOT/storage/uploads"
if [ ! -f "$ROOT/config/license.json" ] && [ -f "$ROOT/config/license.json.example" ]; then
  cp "$ROOT/config/license.json.example" "$ROOT/config/license.json"
  log "Created config/license.json from example (optional)."
fi

log "Validating Compose configuration..."
"${COMPOSE[@]}" config >/dev/null

log "Pulling images (backend + frontend)..."
"${COMPOSE[@]}" pull backend frontend

log "Starting services..."
"${COMPOSE[@]}" up -d

PORT="${ROOOMCHI_HTTP_PORT:-8080}"
log "Waiting for API health on port ${PORT}..."
TRIES=0
until curl -sf "http://127.0.0.1:${PORT}/health" 2>/dev/null | grep -q healthy; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -gt 60 ]; then
    log "Health check timed out. Inspect: ${COMPOSE[*]} logs backend nginx"
    exit 1
  fi
  sleep 3
done

log "Deployment OK."
log "App URL: ${APP_URL}"
log "Status:  ${COMPOSE[*]} ps"
