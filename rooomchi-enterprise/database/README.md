# Database

Production uses **PostgreSQL 16** (`postgres:16-alpine`) defined in `docker-compose.yml`.

- **Initialization:** backend runs migrations on start (`RUN_MIGRATIONS_ON_START=true`).
- **Persistence:** Docker volume `rooomchi_pg_data`.
- **No** `schema.sql` file is required on the server.

For backups and restore, see `docs/BACKUP.md` in the application repository.
