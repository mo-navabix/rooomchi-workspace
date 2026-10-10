# Upgrade

## Standard procedure

1. **Backup** — see [BACKUP.md](./BACKUP.md).
2. **Pull** new release tag or commit.
3. **Review** new files in `database/migrations/`.
4. **Rebuild and restart:**

```bash
npm run prod:up
```

Migrations run automatically via backend entrypoint (`node dist/migrate.cjs`).

## Rollback

1. Stop stack: `npm run prod:down`
2. Restore database from backup if schema changed.
3. Deploy previous image tag:

```bash
export ROOOMCHI_IMAGE_TAG=<previous>
docker compose -f deployment/docker-compose.production.yml --env-file .env up -d
```

(Adjust compose to pin image tags when using a registry.)

## Version pinning

For enterprise deployments, use **GHCR** images with immutable tags (`v1.2.3` or `sha-…`) — see [GHCR.md](./GHCR.md).

```bash
# .env: ROOOMCHI_BACKEND_IMAGE / ROOOMCHI_FRONTEND_IMAGE
npm run prod:ghcr:pull
npm run prod:ghcr:up
```
