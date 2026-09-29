#!/usr/bin/env bash
# Build rooomchi-enterprise-vX.Y.Z.tar.gz (no TypeScript source in package)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VERSION="${ROOOMCHI_RELEASE_VERSION:-$(tr -d '\r\n' < "$ROOT/release/enterprise-template/VERSION")}"
PKG_NAME="rooomchi-enterprise-v${VERSION}"
OUT_BASE="${ROOOMCHI_RELEASE_DIR:-$ROOT/dist-enterprise}"
STAGE="$OUT_BASE/$PKG_NAME"
ARCHIVE="$OUT_BASE/${PKG_NAME}.tar.gz"
TEMPLATE="$ROOT/release/enterprise-template"

log() { printf '[release] %s\n' "$*"; }
die() { log "ERROR: $*"; exit 1; }

log "Version: $VERSION"
log "Typecheck..."
npm run lint

log "Production build (client + server)..."
npm run build

log "Bundle migrate CLI..."
npx esbuild scripts/migrate-cli.ts \
  --bundle --platform=node --format=cjs --packages=external \
  --outfile="$ROOT/dist/migrate.cjs"

[ -f "$ROOT/dist/server.cjs" ] || die "Missing dist/server.cjs — run build failed?"
[ -f "$ROOT/dist/index.html" ] || die "Missing dist/index.html — vite build failed?"

log "Staging $STAGE ..."
rm -rf "$STAGE"
mkdir -p "$STAGE/backend/dist" "$STAGE/frontend/dist"

cp -a "$TEMPLATE/." "$STAGE/"
# Re-copy template without nested staging if cp -a included wrong paths
rm -rf "$STAGE/backend/dist"
mkdir -p "$STAGE/backend/dist" "$STAGE/frontend/dist"

cp "$ROOT/package.json" "$ROOT/package-lock.json" "$STAGE/backend/"
cp "$ROOT/dist/server.cjs" "$ROOT/dist/migrate.cjs" "$STAGE/backend/dist/"

# Static SPA assets only (exclude server bundles)
if command -v rsync >/dev/null 2>&1; then
  rsync -a --exclude='server.cjs' --exclude='migrate.cjs' --exclude='*.map' "$ROOT/dist/" "$STAGE/frontend/dist/"
else
  for f in "$ROOT/dist"/*; do
    base="$(basename "$f")"
    case "$base" in
      server.cjs|migrate.cjs|*.map) continue ;;
    esac
    cp -a "$f" "$STAGE/frontend/dist/"
  done
fi

cp -a "$ROOT/database" "$STAGE/database"
cp "$ROOT/schema.sql" "$STAGE/schema.sql"
cp -a "$ROOT/schema" "$STAGE/schema"

echo "$VERSION" > "$STAGE/VERSION"

chmod +x "$STAGE/install.sh" "$STAGE/backup.sh" "$STAGE/restore.sh" "$STAGE/update.sh"
chmod +x "$STAGE/backend/docker-entrypoint.sh"

log "Creating archive $ARCHIVE ..."
mkdir -p "$OUT_BASE"
tar -czf "$ARCHIVE" -C "$OUT_BASE" "$PKG_NAME"

BYTES="$(wc -c < "$ARCHIVE" | tr -d ' ')"
log "Done: $ARCHIVE ($BYTES bytes)"
log "SHA256: $(sha256sum "$ARCHIVE" 2>/dev/null || shasum -a 256 "$ARCHIVE" 2>/dev/null | awk '{print $1}')"
