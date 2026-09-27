#!/bin/sh
set -e
if [ "${RUN_MIGRATIONS_ON_START:-true}" = "true" ]; then
  echo "[entrypoint] Running database migrations..."
  node dist/migrate.cjs
fi
exec "$@"
