# Rooomchi — Enterprise Self-Hosted Audit (Phase 1)

## Current architecture

| Layer | Technology | Entry / location |
|--------|------------|------------------|
| **Frontend** | React 19 + Vite 8 + Tailwind 4 | `src/`, built with `vite build` |
| **Production API (primary)** | Express on `server.ts` | `src/server/registerApiRoutes.ts`, persistence in `src/server/persistence/` |
| **Alternate API** | NestJS + TypeORM | `apps/api/` (parallel stack; **not** used by default Docker production compose) |
| **Database** | PostgreSQL 16 | `schema.sql`, `schema/02-server-extensions.sql`, reference seed SQL |
| **Local DB** | Docker Compose dev | Root `docker-compose.yml` (Postgres + optional pgAdmin) |
| **Auth** | JWT (`@nestjs/jwt` in Express helpers) | `src/server/authHelpers.ts` |
| **Build** | `vite build` + `esbuild` bundle of `server.ts` | `npm run build` → `dist/` |
| **Run** | `node dist/server.cjs` | Dev: `npm run dev` (Postgres + tsx) |

## Findings

### Strengths

- Single deployable Node server already supports production static hosting (`NODE_ENV=production`).
- PostgreSQL pool and health checks exist (`checkDbStatus`).
- DB CLI (`scripts/db-cli.ts`) for schema extensions, reference data, and demo users.
- Dev Postgres compose includes healthchecks and persistent volume.

### Gaps (addressed in this enterprise package)

| Issue | Risk | Mitigation |
|--------|------|------------|
| No production Docker stack | Manual Node install on servers | `deployment/docker-compose.production.yml` |
| Default JWT secret in code | Critical | `JWT_SECRET` required when `NODE_ENV=production` |
| Auto demo user seed on server start | High in prod | Skipped when `NODE_ENV=production` |
| `/api/health` only, no DB in response | Ops blind spot | `GET /health` with `database: connected\|disconnected` |
| `console.log` only | Poor operability | Structured logging via `pino` |
| No rate limit / prod headers | Abuse | `express-rate-limit` + security headers middleware |
| Migrations not versioned | Upgrade pain | `npm run migrate` + `schema_migrations` table |
| Secrets in dev compose | Confusion for prod | Prod compose uses `.env` only |
| Dual Nest + Express APIs | DevOps confusion | Document Express as **production path**; Nest optional |

### NestJS `apps/api`

Retained for future or separate deployment. Production self-host stack targets **Express** (`deployment/backend/Dockerfile`). TypeORM migrations under `apps/api/src/database/migrations/` are not run by `npm run migrate`.

## Recommended deployment model

```text
Internet → nginx (proxy) → frontend (static) + backend (API) → PostgreSQL
```

Commands:

```bash
cp .env.example .env
# Edit POSTGRES_PASSWORD, JWT_SECRET, APP_URL
npm run prod:up
```

## Upgrade path

1. Pull new image / rebuild compose.
2. Backend entrypoint runs `dist/migrate.cjs` (new SQL in `database/migrations/`).
3. Rolling restart: `docker compose ... up -d --build`.

## Server specifications (minimum)

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Disk | 20 GB SSD | 50 GB SSD |
| OS | Ubuntu 22.04+ | Ubuntu 24.04 LTS |

Requires: Docker Engine 24+, Docker Compose v2.
