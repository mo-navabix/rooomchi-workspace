# Installation (self-hosted)

## Requirements

- Docker Engine 24+ and Docker Compose plugin v2
- Ubuntu 22.04/24.04 LTS (or any Linux with Docker)
- Open ports: `80` (and `443` when TLS is configured)

## Quick start

```bash
git clone <repository-url> rooomchi
cd rooomchi
cp .env.example .env
```

Edit `.env`:

- `POSTGRES_PASSWORD` — strong password
- `JWT_SECRET` — at least 32 random characters
- `APP_URL` — public URL (e.g. `https://meetings.company.ir`)

Start the stack:

```bash
npm run prod:up
```

Open `http://<server-ip>/` (or your `APP_URL`).

## Optional reference seed

After first boot (migrations applied):

```bash
docker compose -f deployment/docker-compose.production.yml exec backend node dist/seed.cjs
```

Demo users (`--demo`) are for **non-production** only:

```bash
docker compose -f deployment/docker-compose.production.yml exec backend node dist/seed.cjs --demo
```

## Without Node on the host

All runtime dependencies are inside containers. Node is only needed on the host if you run `npm run migrate` locally.

## Next steps

- [DEPLOYMENT.md](./DEPLOYMENT.md) — operations
- [CONFIGURATION.md](./CONFIGURATION.md) — environment variables
- [BACKUP.md](./BACKUP.md) — database backup
