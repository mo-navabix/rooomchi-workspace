# Rooomchi Enterprise — Installation Guide (v1.0.0)

Backend and frontend run from **GHCR** images (`IMAGE_GHCR_*` in `config/.env`). You do not need Node.js or the source repository on the server.

## Requirements

| Item | Minimum |
|------|---------|
| OS | Linux (Ubuntu 22.04+ recommended) |
| CPU / RAM | 2 vCPU / 4 GB RAM |
| Disk | 20 GB SSD |
| Software | Docker Engine 24+, Docker Compose v2 |
| Ports | `127.0.0.1:10808` (or `ROOOMCHI_HTTP_PORT`) — host nginx serves HTTPS on 443 |

## Quick install

```bash
tar -xzf rooomchi-enterprise-v1.0.0.tar.gz
cd rooomchi-enterprise-v1.0.0
chmod +x install.sh backup.sh restore.sh update.sh
./install.sh
```

1. First run creates `config/.env` — set `IMAGE_GHCR_BACKEND`, `IMAGE_GHCR_FRONTEND`, `APP_URL`, `POSTGRES_PASSWORD`, and `JWT_SECRET`, then run `./install.sh` again.
2. Log in to GHCR on the server: `docker login ghcr.io -u OWNER -p <PAT>` (PAT needs `read:packages`).
3. Open `${APP_URL}/install` and complete the setup wizard (organization + admin).
4. Verify: `curl -s http://127.0.0.1:10808/health` and `curl -sI https://room.acorex.ir/health`

## Watchtower (auto-updates)

Containers **backend** and **frontend** are labeled `com.centurylinklabs.watchtower.enable=true`. Postgres and nginx are excluded.

If Watchtower already runs on the server, enable label filtering on that instance (`WATCHTOWER_LABEL_ENABLE=true`), then recreate the stack so labels apply:

```bash
docker compose --env-file config/.env up -d --force-recreate
```

Do **not** start the compose `watchtower` service unless you want a dedicated updater for this stack only:

```bash
docker compose --env-file config/.env --profile watchtower up -d
```

Watchtower pulls new tags from GHCR when you publish updated `IMAGE_GHCR_*` references (e.g. `:latest`). Or run `./update.sh` to refresh compose/nginx and `docker compose pull`.

## Layout

```text
rooomchi-enterprise-v1.0.0/
├── install.sh, backup.sh, restore.sh, update.sh
├── docker-compose.yml
├── nginx/
├── config/           # .env, license.json (not overwritten on update)
└── storage/uploads/  # File uploads volume
```

## TLS / custom domain (host nginx → Docker)

Recommended when the server already runs nginx on 80/443 (e.g. `room.acorex.ir`):

1. In `config/.env`: `ROOOMCHI_HTTP_PORT=10808`, `APP_URL=https://room.acorex.ir`, `CORS_ORIGIN=https://room.acorex.ir`.
2. Copy and enable `nginx/host-reverse-proxy.conf.example` on the **host** (see comments in that file). It proxies to `http://127.0.0.1:10808`.
3. Issue TLS: `certbot --nginx -d room.acorex.ir`, then `nginx -t && systemctl reload nginx`.
4. Recreate the stack so Docker binds localhost only: `docker compose --env-file config/.env up -d`.
5. Set organization domain in the setup wizard or Admin → Organization.

Alternative: terminate TLS inside Docker (`listen 443` in `nginx/nginx.conf` + cert volume).

## Troubleshooting

- **Backend unhealthy:** `docker compose logs backend` — check `DATABASE_URL` and migrations.
- **502 from nginx:** wait for backend healthcheck or inspect `docker compose ps`.
- **Setup disabled:** installation already completed; use admin login instead of `/install`.

See also: [UPDATE_GUIDE.md](./UPDATE_GUIDE.md), [ADMIN_GUIDE.md](./ADMIN_GUIDE.md).
