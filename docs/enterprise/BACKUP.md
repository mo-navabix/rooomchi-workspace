# Backup & Restore

## Database

```bash
docker compose exec postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /tmp/rooomchi.dump
docker compose cp postgres:/tmp/rooomchi.dump ./backups/rooomchi-$(date +%F).dump
```

Restore:

```bash
docker compose exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists < backups/rooomchi.dump
```

## Files

Backup volume `rooomchi-enterprise/storage/uploads` (or `UPLOAD_PATH`).

## Schedule

Use cron on the host or Kubernetes CronJob calling the commands above.

**Roadmap:** Admin UI «Create Backup / Restore / Schedule» will wrap these operations via a secured API.
