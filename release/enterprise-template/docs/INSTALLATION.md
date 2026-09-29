# Rooomchi Enterprise — Installation Guide (v1.0.0)

This package contains **pre-built** frontend and backend artifacts. You do not need Node.js or the source repository on the server.

## Requirements

| Item | Minimum |
|------|---------|
| OS | Linux (Ubuntu 22.04+ recommended) |
| CPU / RAM | 2 vCPU / 4 GB RAM |
| Disk | 20 GB SSD |
| Software | Docker Engine 24+, Docker Compose v2 |
| Ports | 80 (or `ROOOMCHI_HTTP_PORT`) |

## Quick install

```bash
tar -xzf rooomchi-enterprise-v1.0.0.tar.gz
cd rooomchi-enterprise-v1.0.0
chmod +x install.sh backup.sh restore.sh update.sh
./install.sh
```

1. First run creates `config/.env` — edit `APP_URL`, `POSTGRES_PASSWORD`, and `JWT_SECRET`, then run `./install.sh` again.
2. Open `http://<your-server>/install` and complete the setup wizard (organization + admin).
3. Verify: `curl -s http://localhost/health`

## Layout

```text
rooomchi-enterprise-v1.0.0/
├── install.sh, backup.sh, restore.sh, update.sh
├── docker-compose.yml
├── backend/          # API image build context (compiled JS)
├── frontend/         # Static SPA image build context
├── database/         # SQL migrations
├── schema/           # Core schema extensions
├── schema.sql
├── nginx/
├── config/           # .env, license.json (not overwritten on update)
└── storage/uploads/  # File uploads volume
```

## TLS / custom domain

1. Set `APP_URL` and `CORS_ORIGIN` to your HTTPS URL in `config/.env`.
2. Place a reverse proxy or extend `nginx/nginx.conf` with `listen 443 ssl` and certificates.
3. Set organization domain in the setup wizard or Admin → Organization.

## Troubleshooting

- **Backend unhealthy:** `docker compose logs backend` — check `DATABASE_URL` and migrations.
- **502 from nginx:** wait for backend healthcheck or inspect `docker compose ps`.
- **Setup disabled:** installation already completed; use admin login instead of `/install`.

See also: [UPDATE_GUIDE.md](./UPDATE_GUIDE.md), [ADMIN_GUIDE.md](./ADMIN_GUIDE.md).
