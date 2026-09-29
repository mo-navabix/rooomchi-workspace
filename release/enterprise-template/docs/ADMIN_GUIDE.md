# Rooomchi Enterprise — Administrator Guide

## After installation

1. Sign in with the admin account created in the setup wizard.
2. Open **Business mode** → **Organization settings** (سازمان، احراز هویت، یکپارچه‌سازی، سامانه، ممیزی).

## Configuration layers

| Layer | Where | Examples |
|-------|--------|----------|
| Infrastructure | `config/.env` on server | `JWT_SECRET`, `POSTGRES_*`, `APP_URL` |
| License | `config/license.json` | `maxUsers`, `expireDate`, `features` |
| Organization | Web UI + database | Branding, domain, booking rules |
| Integrations | Web UI | SMTP, LDAP, Google OAuth per organization |

## Security checklist

- Use strong `JWT_SECRET` (≥ 32 characters) and unique `POSTGRES_PASSWORD`.
- Set `SETUP_ENCRYPTION_KEY` to encrypt LDAP/SMTP secrets at rest (optional; falls back to JWT in dev only).
- Restrict host firewall to required ports.
- Enable HTTPS at the reverse proxy; set `APP_URL` to the public HTTPS URL.

## Authentication

- **Local** email/password (default).
- **LDAP** — configure in setup or Admin → Authentication; test connection from UI.
- **Google OAuth** — per-organization client ID/secret and redirect URI.

See repository authentication docs if you received the full documentation bundle.

## Storage

Uploaded files are stored under `storage/uploads/` on the host (mounted into the backend container).

## Health and logs

```bash
curl -s http://localhost/health
docker compose logs -f backend
docker compose logs -f nginx
```

## Backups

Run `./backup.sh` before upgrades or major changes. Archives are stored in `backups/` by default.

## Support tickets and notifications

Configure SMS/Telegram and notification templates from the organization admin area when enabled for your license.
