# Rooomchi Enterprise — Production (GHCR)

Self-hosted deployment **without application source** on the server. Backend and frontend are pulled from **GitHub Container Registry** (`ghcr.io`).

**Example server path:** `/opt/room.acorex.ir`  
**Example domain:** `https://room.acorex.ir`

## Directory layout

```text
/opt/room.acorex.ir/
├── docker-compose.yml
├── docker-compose.https.yml   # optional TLS inside Docker nginx
├── deploy.sh
├── config/
│   ├── .env                   # secrets (not in git)
│   ├── .env.example
│   └── license.json           # optional on-prem license
├── nginx/
│   ├── nginx.conf
│   ├── nginx.https.conf
│   └── ssl/                   # optional certs for https override
└── storage/uploads/           # persisted uploads
```

`backend/`, `frontend/`, and `database/` folders are **not required** for GHCR deploy (README placeholders only).

## Prerequisites

- Linux server with Docker 24+ and Docker Compose v2
- GHCR images published (workflow `Publish to GHCR` in the app repository)
- PAT with `read:packages` for private images
- 4 GB RAM minimum (8 GB recommended)

## 1. GHCR authentication

```bash
echo "$GHCR_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Packages (owner = lowercase GitHub user/org):

- `ghcr.io/OWNER/rooomchi-backend:TAG`
- `ghcr.io/OWNER/rooomchi-frontend:TAG`

See [docs/GHCR.md](../docs/GHCR.md) in the application repository.

## 2. Environment

```bash
cd /opt/room.acorex.ir
cp config/.env.example config/.env
nano config/.env
```

**Required:** `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_SECRET` (≥32 chars), `APP_URL`, `CORS_ORIGIN`, `IMAGE_GHCR_BACKEND`, `IMAGE_GHCR_FRONTEND`.

**Important:** Compose substitutes `${POSTGRES_*}` from the **project** env file only when you pass:

```bash
docker compose --env-file ./config/.env <command>
```

Service-level `env_file` alone does **not** fill variables in `docker-compose.yml` interpolation.

Pin **immutable** image tags (`v2.1.0` or `sha-…`), not `latest`, in production.

## 3. Initial install

```bash
chmod +x deploy.sh
./deploy.sh
```

Manual equivalent:

```bash
docker compose --env-file ./config/.env config
docker compose --env-file ./config/.env pull backend frontend
docker compose --env-file ./config/.env up -d
curl -s http://127.0.0.1:${ROOOMCHI_HTTP_PORT:-8080}/health
```

Open `${APP_URL}/install` or `/setup` and complete the wizard.

## 4. Database

- **No** `schema.sql` bind-mount on the server.
- On start, the backend image runs `node dist/migrate.cjs` when `RUN_MIGRATIONS_ON_START=true` (default).
- Schema files are **inside** the backend image (`schema/`, `dist/migrate.cjs`).
- Data persists in Docker volume `rooomchi_pg_data`.
- **Never** run `docker compose down -v` in production.

## 5. HTTPS and host nginx

### A — TLS on host (recommended when port 80/443 is shared)

1. Set `ROOOMCHI_HTTP_PORT=8080` (or another free port) in `config/.env`.
2. Point host reverse proxy at `http://127.0.0.1:8080`.
3. Set `APP_URL` / `CORS_ORIGIN` to `https://room.acorex.ir`.
4. Forward `X-Forwarded-Proto` and `X-Forwarded-For`.

### B — TLS inside Docker

```bash
mkdir -p nginx/ssl
# fullchain.pem + privkey.pem
docker compose --env-file ./config/.env \
  -f docker-compose.yml -f docker-compose.https.yml up -d
```

## 6. Upgrades

1. Backup PostgreSQL ([BACKUP.md](../docs/BACKUP.md)).
2. Update `IMAGE_GHCR_*` tags in `config/.env`.
3. `./deploy.sh` or `docker compose --env-file ./config/.env pull && up -d`.

**Rollback:** set previous image tags in `config/.env`, then pull and `up -d` again. Do not remove volumes.

## 7. Operations

| Task | Command |
|------|---------|
| Logs | `docker compose --env-file ./config/.env logs -f backend nginx` |
| Stop | `docker compose --env-file ./config/.env stop` |
| Start | `docker compose --env-file ./config/.env start` |
| Status | `docker compose --env-file ./config/.env ps` |

Optional auto-updates (Watchtower profile — use pinned tags carefully):

```bash
docker compose --env-file ./config/.env --profile watchtower up -d
```

## 8. Troubleshooting

| Error | Fix |
|-------|-----|
| `POSTGRES_USER variable is not set` | Use `--env-file ./config/.env` on every compose command |
| `lstat /opt/deployment` / `Dockerfile not found` | Remove old `build:` blocks; use GHCR `image:` only |
| `denied` on pull | `docker login ghcr.io`, PAT `read:packages` |
| `manifest unknown` | Check tag on GitHub Packages; owner lowercase |
| 502 / unhealthy backend | `logs backend`; wait for migrations; check `DATABASE_URL` |
| CORS / wrong redirects | `APP_URL` and `CORS_ORIGIN` must match public URL |

## Related docs (application repo)

- [GHCR.md](../docs/GHCR.md)
- [CUSTOMER_GO_LIVE.md](../docs/CUSTOMER_GO_LIVE.md)
- [UPGRADE.md](../docs/UPGRADE.md)
- [docs/enterprise/INSTALLATION.md](../docs/enterprise/INSTALLATION.md)
