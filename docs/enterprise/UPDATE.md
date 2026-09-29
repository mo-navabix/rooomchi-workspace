# Updates & Migrations

## Current version

- Application: `package.json` → `version`
- API: `GET /api/enterprise/version`
- Admin UI: Settings → System → Enterprise block

## Apply migrations

```bash
# Inside backend container or CI
npm run migrate
```

Migrations are recorded in `schema_migrations`.

## Safe update procedure

1. Backup database and uploads (see BACKUP.md)  
2. Pull new image / `docker compose build`  
3. Run migrations (`RUN_MIGRATIONS_ON_START=true` or manual `migrate`)  
4. Verify `/health` and smoke-test login  

## Available updates

Release channel and `availableUpdate` in admin UI are placeholders until Phase 4 (update manifest).
