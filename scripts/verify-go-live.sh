#!/usr/bin/env bash
# Post-deploy smoke checks. Usage:
#   export APP_URL=https://rooms.customer.ir   # or http://localhost
#   ./scripts/verify-go-live.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE="${ROOOMCHI_VERIFY_URL:-${APP_URL:-http://localhost}}"
BASE="${BASE%/}"

echo "==> Rooomchi go-live verify: $BASE"

if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
  if git ls-files --error-unmatch .env >/dev/null 2>&1; then
    echo "FAIL: .env is still tracked by git. Run: git rm --cached .env"
    exit 1
  fi
  if [[ -f .env ]] && ! git check-ignore -q .env 2>/dev/null; then
    echo "WARN: .env exists but is not listed in .gitignore"
  else
    echo "OK: .env not tracked / ignored"
  fi
fi

health_json="$(curl -fsS "$BASE/health" 2>/dev/null || curl -fsS "$BASE/api/health" 2>/dev/null || true)"
if [[ -z "$health_json" ]]; then
  echo "FAIL: cannot reach /health or /api/health on $BASE"
  exit 1
fi
echo "OK: health → $health_json"

setup_json="$(curl -fsS "$BASE/api/setup/status" 2>/dev/null || true)"
if [[ -n "$setup_json" ]]; then
  echo "OK: setup status → $setup_json"
else
  echo "WARN: /api/setup/status not reachable (proxy routing?)"
fi

if [[ -n "${IMAGE_GHCR_BACKEND:-}" ]]; then
  echo "INFO: IMAGE_GHCR_BACKEND=$IMAGE_GHCR_BACKEND"
elif [[ -f .env ]] && grep -q '^IMAGE_GHCR_BACKEND=' .env; then
  grep '^IMAGE_GHCR_BACKEND=' .env || true
else
  echo "WARN: set IMAGE_GHCR_BACKEND in .env for release pinning"
fi

echo "==> Done. Complete wizard at $BASE/setup if not initialized."
