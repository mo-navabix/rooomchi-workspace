# Backup and restore

## Scripts

- `database/backup/backup.sh` — `pg_dump` to gzip
- `database/backup/restore.sh` — restore from gzip

## Backup (from host with `pg_dump`)

With `.env` loaded:

```bash
export $(grep -v '^#' .env | xargs)
./database/backup/backup.sh
```

Or inside the Postgres container:

```bash
docker compose -f deployment/docker-compose.production.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > rooomchi_manual.sql.gz
```

## Restore

**Warning:** overwrites existing data.

```bash
./database/backup/restore.sh database/backup/archives/rooomchi_YYYYMMDD.sql.gz
```

Stop the backend during restore to avoid active connections:

```bash
docker compose -f deployment/docker-compose.production.yml stop backend
# restore
docker compose -f deployment/docker-compose.production.yml start backend
```

## Schedule

| Environment | Suggestion |
|-------------|------------|
| Production | Daily full backup, retain 30 days |
| Staging | Weekly |
| Before upgrade | Manual backup |

Use cron on the host or your orchestrator’s volume snapshot tooling.
