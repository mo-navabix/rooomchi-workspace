# Configuration Guide

## Layers

| Layer | Source | Examples |
|-------|--------|----------|
| Infrastructure | `config/.env` or `.env` | `DATABASE_URL`, `JWT_SECRET`, `APP_URL` |
| License | `config/license.json` | `maxUsers`, `expireDate`, `features` |
| Organization | PostgreSQL + Admin UI | branding, auth, SMTP, booking rules |
| Runtime | `system_settings` table | maintenance mode, session timeout |

## Required production variables

- `JWT_SECRET` (≥ 32 chars)
- `POSTGRES_PASSWORD`
- `APP_URL` (public HTTPS URL)
- `CORS_ORIGIN` (if frontend on another origin)

## Optional

- `LICENSE_PATH` — defaults to `config/license.json`
- `UPLOAD_PATH` — local file storage
- `SETUP_ENCRYPTION_KEY` — encrypts integration secrets at rest

Organization domain for login branding is **not** hard-coded; set during setup or in Admin → Organization.
