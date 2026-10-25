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

## `Too many requests` (HTTP 429)

The API rate limiter applies only when **`NODE_ENV=production`** (default cap: 300 requests / 15 minutes per IP on `/api`).

**Local development**

- Prefer **`npm run dev`** (not `npm run start` unless you built the client and set `NODE_ENV=production`).
- With `npm run dev`, rate limiting is **off** automatically.
- If you still see 429 after testing production mode locally, restart the server (the counter is in-memory) or set in `.env`:
  - `RATE_LIMIT_MAX=0` to disable, or
  - `RATE_LIMIT_MAX=5000` for a higher cap.

**Production**

- Raise `RATE_LIMIT_MAX` in `.env` if many users share one NAT IP.
- Restart backend after changing env vars.

## Local dev vs production

| | Dev | Production compose |
|---|-----|---------------------|
| Compose file | `docker-compose.yml` | `deployment/docker-compose.production.yml` |
| App run | `npm run dev` | Containers only |
| Demo seed on start | Yes | No |
| API rate limit | Off (`NODE_ENV` ≠ production) | On (`RATE_LIMIT_MAX`) |
