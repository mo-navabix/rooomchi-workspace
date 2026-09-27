# PostgreSQL (production)

Production Postgres runs from `deployment/docker-compose.production.yml`.

- Credentials come from `.env` (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`).
- Data is stored in the Docker volume `rooomchi_pg_data`.
- Schema is applied by the **backend** container on startup (`node dist/migrate.cjs`), not via `docker-entrypoint-initdb.d`.

For backups and restores, see `docs/BACKUP.md` and `database/backup/`.
