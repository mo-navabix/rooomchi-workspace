#!/usr/bin/env bash
# Optional RBAC smoke test (requires running deployment + tokens).
# export ROOOMCHI_VERIFY_URL=https://rooms.example.com
# export ROOOMCHI_EMPLOYEE_TOKEN=eyJ...
# export ROOOMCHI_ORG_A_ADMIN_TOKEN=eyJ...
# export ROOOMCHI_ORG_B_ADMIN_TOKEN=eyJ...   # optional second org
set -euo pipefail

BASE="${ROOOMCHI_VERIFY_URL:-${APP_URL:-http://localhost}}"
BASE="${BASE%/}"

code_no_auth="$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/admin/organization" || echo 000)"
if [[ "$code_no_auth" != "401" && "$code_no_auth" != "403" ]]; then
  echo "FAIL: unauthenticated admin call expected 401/403, got $code_no_auth"
  exit 1
fi
echo "OK: unauthenticated admin → $code_no_auth"

if [[ -n "${ROOOMCHI_EMPLOYEE_TOKEN:-}" ]]; then
  code_emp="$(curl -s -o /dev/null -w '%{http_code}' \
    -H "Authorization: Bearer $ROOOMCHI_EMPLOYEE_TOKEN" \
    "$BASE/api/admin/organization" || echo 000)"
  if [[ "$code_emp" != "403" && "$code_emp" != "401" ]]; then
    echo "FAIL: employee admin access expected 403, got $code_emp"
    exit 1
  fi
  echo "OK: employee cannot access admin → $code_emp"
else
  echo "SKIP: set ROOOMCHI_EMPLOYEE_TOKEN for employee test"
fi

if [[ -n "${ROOOMCHI_ORG_A_ADMIN_TOKEN:-}" ]]; then
  body_a="$(curl -fsS -H "Authorization: Bearer $ROOOMCHI_ORG_A_ADMIN_TOKEN" \
    "$BASE/api/admin/organization" || echo '{}')"
  echo "OK: org A admin organization payload length ${#body_a}"
else
  echo "SKIP: set ROOOMCHI_ORG_A_ADMIN_TOKEN"
fi

if [[ -n "${ROOOMCHI_ORG_A_ADMIN_TOKEN:-}" && -n "${ROOOMCHI_ORG_B_ADMIN_TOKEN:-}" ]]; then
  id_a="$(echo "$body_a" | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
  body_b="$(curl -fsS -H "Authorization: Bearer $ROOOMCHI_ORG_B_ADMIN_TOKEN" \
    "$BASE/api/admin/organization" || echo '{}')"
  id_b="$(echo "$body_b" | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
  if [[ -n "$id_a" && -n "$id_b" && "$id_a" == "$id_b" ]]; then
    echo "FAIL: org A and org B admin see same organization id"
    exit 1
  fi
  echo "OK: org A/B organization ids differ (or could not parse ids)"
fi

echo "==> RBAC smoke finished. See docs/SECURITY_ACCEPTANCE.md for full manual matrix."
