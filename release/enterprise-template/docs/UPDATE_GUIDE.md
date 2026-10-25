# Rooomchi Enterprise — Update Guide

## Before you update

1. Read the release notes for the target version.
2. Run a backup: `./backup.sh`
3. Plan a short maintenance window (restart required).

## In-place upgrade (recommended)

1. Copy the new `rooomchi-enterprise-vX.Y.Z.tar.gz` to the server.
2. From your **existing** install directory:

```bash
./update.sh /path/to/rooomchi-enterprise-v1.0.0.tar.gz
```

This will:

- Extract updated `docker-compose.yml`, `nginx/`, and scripts when present in the tarball
- **Preserve** `config/` and `storage/`
- Run `./backup.sh` automatically
- Pull latest GHCR images (`IMAGE_GHCR_*`), run migrations on backend start, and restart services

## Manual upgrade

```bash
./backup.sh
docker compose stop backend
# replace application files (keep config/ and storage/)
docker compose --env-file config/.env pull backend frontend
docker compose --env-file config/.env up -d
```

Migrations run when `RUN_MIGRATIONS_ON_START=true` (default).

## Rollback

1. Stop stack: `docker compose down`
2. Restore database: `./restore.sh backups/rooomchi_<timestamp>.sql.gz`
3. Re-deploy previous release tarball if application files were upgraded.

## Version file

Check `VERSION` in the package root for the shipped application version.
