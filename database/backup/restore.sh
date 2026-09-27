#!/usr/bin/env sh
set -euo pipefail

# Rooomchi PostgreSQL restore
# Usage: ./database/backup/restore.sh path/to/backup.sql.gz
# WARNING: overwrites data in the target database.

BACKUP_FILE="${1:?Usage: restore.sh <backup.sql.gz>}"

if [ -n "${DATABASE_URL:-}" ]; then
  gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
else
  : "${POSTGRES_USER:?POSTGRES_USER required}"
  : "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD required}"
  : "${POSTGRES_DB:?POSTGRES_DB required}"
  PGHOST="${POSTGRES_HOST:-localhost}"
  PGPORT="${POSTGRES_PORT:-5432}"
  export PGPASSWORD="$POSTGRES_PASSWORD"
  gunzip -c "$BACKUP_FILE" | psql -h "$PGHOST" -p "$PGPORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB"
  unset PGPASSWORD
fi

echo "Restore completed from: $BACKUP_FILE"
