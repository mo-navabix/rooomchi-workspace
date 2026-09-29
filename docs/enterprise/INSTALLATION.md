# Enterprise Installation Guide

## Prerequisites

- Docker 24+ and Docker Compose v2
- 4 GB RAM minimum (8 GB recommended)
- Ports 80/443 (or custom `ROOOMCHI_HTTP_PORT`)

## Option A — `rooomchi-enterprise` (recommended for IT)

```bash
git clone <repo-url>
cd rooomchi/rooomchi-enterprise
cp config/.env.example config/.env
# Edit JWT_SECRET, POSTGRES_PASSWORD, APP_URL
docker compose up -d --build
```

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
