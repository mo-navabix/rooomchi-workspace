# Troubleshooting

## Backend unhealthy

```bash
docker compose -f deployment/docker-compose.production.yml logs backend
curl -s http://localhost/health
```

Common causes:

- `JWT_SECRET` missing in production
- Postgres not ready — wait for `postgres` healthcheck
- Migration failure — check logs for `migration_failed`

## 503 on API

- Verify `DATABASE_URL` in backend container:  
  `docker compose ... exec backend env | grep DATABASE`
- Run migrations manually:  
  `docker compose ... exec backend node dist/migrate.cjs`

## CORS errors

Set `CORS_ORIGIN` to the exact browser origin (scheme + host + port).

## Cannot login after install

Run reference seed (no demo users by default):

```bash
docker compose ... exec backend node dist/seed.cjs
```

Create admin via your organization provisioning flow or use `--demo` only in dev.

## Port 80 in use

Set `ROOOMCHI_HTTP_PORT=8080` in `.env` and access `http://host:8080`.

## Local dev vs production

| | Dev | Production compose |
|---|-----|---------------------|
| Compose file | `docker-compose.yml` | `deployment/docker-compose.production.yml` |
| App run | `npm run dev` | Containers only |
| Demo seed on start | Yes | No |
