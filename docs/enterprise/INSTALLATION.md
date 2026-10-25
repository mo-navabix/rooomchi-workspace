# Enterprise Installation Guide

## Prerequisites

- Docker 24+ and Docker Compose v2
- 4 GB RAM minimum (8 GB recommended)
- Ports 80/443 (or custom `ROOOMCHI_HTTP_PORT`)

## Option A — `rooomchi-enterprise` (recommended for IT, GHCR)

Copy the `rooomchi-enterprise/` folder to the server (e.g. `/opt/room.acorex.ir`). **No application source** is required on the server.

```bash
cd /opt/room.acorex.ir
cp config/.env.example config/.env
# Edit JWT_SECRET, POSTGRES_PASSWORD, APP_URL, IMAGE_GHCR_*
echo "$GHCR_PAT" | docker login ghcr.io -u YOUR_GITHUB_USER --password-stdin
chmod +x deploy.sh
./deploy.sh
```

Always pass the env file for Compose interpolation:

```bash
docker compose --env-file ./config/.env up -d
```

See [rooomchi-enterprise/README.md](../../rooomchi-enterprise/README.md) and [GHCR.md](../GHCR.md).

Open `APP_URL/install` and complete the wizard.

## Option B — Repository root

```bash
cp .env.example .env
npm run prod:up
```

## Post-install

```bash
curl -s http://localhost/health
curl -s http://localhost/api/setup/status
npm run migrate   # from dev machine with DATABASE_URL if not RUN_MIGRATIONS_ON_START
```

## Reset installation (dev only)

```bash
npm run setup:reset
```
