# Configuration

All secrets and environment-specific values belong in `.env` (never in Dockerfiles or git).

## Core

| Variable | Required (prod) | Description |
|----------|-----------------|-------------|
| `APP_URL` | Yes | Public base URL |
| `JWT_SECRET` | Yes | Signing key for API tokens |
| `POSTGRES_USER` | Yes (compose) | DB user |
| `POSTGRES_PASSWORD` | Yes (compose) | DB password |
| `POSTGRES_DB` | No | Default `rooomchi_db` |
| `DATABASE_URL` | Set by compose | Backend connection string |

## Security

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGIN` | `APP_URL` if unset | Comma-separated origins |
| `RATE_LIMIT_MAX` | `300` | Requests per window per IP |
| `RATE_LIMIT_WINDOW_MS` | `900000` | 15 minutes |

## Application

| Variable | Description |
|----------|-------------|
| `LOG_LEVEL` | `info`, `debug`, `warn`, `error` |
| `GEMINI_API_KEY` | Optional AI features |
| `RUN_MIGRATIONS_ON_START` | `true` in Docker entrypoint |
| `ROOOMCHI_HTTP_PORT` | Published HTTP port (default `80`) |

## SMTP (optional)

`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_SECURE`

## Storage (optional)

`STORAGE_DRIVER`, `STORAGE_LOCAL_PATH`, or S3 variables — see `.env.example`.

Full template: `.env.example`.
