# Deployment

## Production Compose

File: `deployment/docker-compose.production.yml`

Services:

| Service | Role |
|---------|------|
| `postgres` | PostgreSQL 16, persistent volume |
| `backend` | Express API, migrations on start |
| `frontend` | Vite build served by Nginx |
| `proxy` | Edge Nginx — `/api` → backend, `/` → frontend |

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
