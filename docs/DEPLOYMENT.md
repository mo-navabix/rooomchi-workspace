# Deployment

## Production Compose

| File | Use case |
|------|----------|
| `deployment/docker-compose.production.yml` | Build images on the server (`npm run prod:up`) |
| `deployment/docker-compose.prod.ghcr.yml` | Pull backend/frontend from GHCR + Postgres + proxy + Watchtower — [GHCR.md](./GHCR.md) |

Services (both stacks):

| Service | Role |
|---------|------|
| `postgres` | PostgreSQL 16, persistent volume |
| `backend` | Express API, migrations on start |
| `frontend` | Vite build served by Nginx |
| `proxy` | Edge Nginx — `/api` → backend, `/` → frontend |
| `watchtower` | GHCR stack only — auto-pull labeled app containers |

## Commands

```bash
# Start / rebuild
npm run prod:up

# Logs
npm run prod:logs

# Stop (keep data)
npm run prod:down

# Stop and remove volumes (destructive)
docker compose -f deployment/docker-compose.production.yml --env-file .env down -v
```

## Health checks

- Backend: `GET http://<host>/health` → `{"status":"healthy","database":"connected"}`
- Docker healthchecks are defined on `postgres`, `backend`, `frontend`, and rely on backend for stack readiness.

## TLS / SSL

1. Place certificates on the host or use a sidecar (e.g. certbot).
2. Extend `deployment/nginx/nginx.conf` with a `listen 443 ssl` server block.
3. Set `APP_URL` and `CORS_ORIGIN` to the HTTPS URL.

## CI/CD

See `.github/workflows/ci.yml` for build, test, and image publish skeleton.

## Kubernetes

Manifests under `kubernetes/` are a starting point; adjust storage class, ingress, and secrets for your cluster.
