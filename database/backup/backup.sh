#!/usr/bin/env sh
set -euo pipefail

# Rooomchi PostgreSQL backup
# Usage: ./database/backup/backup.sh [output_dir]
# Requires: pg_dump, env POSTGRES_* or DATABASE_URL

OUT_DIR="${1:-./database/backup/archives}"
mkdir -p "$OUT_DIR"
STAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
FILE="$OUT_DIR/rooomchi_${STAMP}.sql.gz"

if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "$DATABASE_URL" | gzip -c > "$FILE"
else
  : "${POSTGRES_USER:?POSTGRES_USER required}"
  : "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD required}"
  : "${POSTGRES_DB:?POSTGRES_DB required}"
  PGHOST="${POSTGRES_HOST:-localhost}"
  PGPORT="${POSTGRES_PORT:-5432}"
  export PGPASSWORD="$POSTGRES_PASSWORD"
  pg_dump -h "$PGHOST" -p "$PGPORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip -c > "$FILE"
  unset PGPASSWORD
fi

echo "Backup written: $FILE"
