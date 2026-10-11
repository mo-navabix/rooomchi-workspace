# Customer go-live checklist (self-hosted / GHCR)

Use this before handing Rooomchi to an enterprise customer. Order matches recommended execution.

## 1. Secrets and Git

- [ ] Copy `.env.example` → `.env` on the **server only** (never commit `.env`).
- [ ] Confirm `.env` is ignored: `git check-ignore -v .env` → should match `.gitignore`.
- [ ] If `.env` or real credentials were ever committed, follow [SECRETS_ROTATION.md](./SECRETS_ROTATION.md) and rotate **all** exposed values.
- [ ] Generate production values: `JWT_SECRET` (32+ random chars), `POSTGRES_PASSWORD`, `SETUP_ENCRYPTION_KEY` (optional, 32+ chars).

## 2. PostgreSQL

**Option A — bundled Postgres (default)**

`deployment/docker-compose.prod.ghcr.yml` — set `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.

**Option B — external / managed DB**

Set in `.env`:

```env
DATABASE_URL=postgresql://USER:PASS@db.customer.internal:5432/rooomchi_db
DATABASE_SSL=true
```

Deploy with:

```bash
npm run prod:ghcr:external:up
```

Ensure the DB allows connections from the app server (firewall, SSL, extensions if any).

## 3. Clean server install (GHCR)

On a **fresh** Linux host with Docker Compose v2:

```bash
git clone <repo-url> && cd <repo>
cp .env.example .env
# Edit: IMAGE_GHCR_*, JWT_SECRET, POSTGRES_* or DATABASE_URL, APP_URL
docker login ghcr.io -u GITHUB_USER -p 'PAT_WITH_read:packages'
npm run prod:ghcr:pull
npm run prod:ghcr:up
```

Verify:

```bash
./scripts/verify-go-live.sh
```

- [ ] Open `APP_URL/setup` and complete the wizard.
- [ ] Log in as org admin, create a room, create a booking.
- [ ] Pin images to a release tag (e.g. `v2.1.0`), not `latest`, unless you accept auto-upgrades via Watchtower.

```env
IMAGE_GHCR_BACKEND=ghcr.io/OWNER/rooomchi-backend:v2.1.0
IMAGE_GHCR_FRONTEND=ghcr.io/OWNER/rooomchi-frontend:v2.1.0
```

## 4. Security and org isolation

Manual checks (see [SECURITY_ACCEPTANCE.md](./SECURITY_ACCEPTANCE.md)):

- [ ] Employee cannot access `/api/admin/*`.
- [ ] Org A admin cannot read org B data (rooms, bookings, users).
- [ ] Invalid/expired JWT returns 401.
- [ ] After setup, `/api/setup/complete` returns 403.

Optional script (requires running API + test users):

```bash
export ROOOMCHI_VERIFY_URL=https://your-domain
export ROOOMCHI_ORG_A_ADMIN_TOKEN=...
export ROOOMCHI_ORG_B_ADMIN_TOKEN=...
./scripts/security-rbac-smoke.sh
```

## 5. HTTPS and backup

**HTTPS**

```bash
mkdir -p deployment/nginx/ssl
# fullchain.pem + privkey.pem — see deployment/nginx/SSL_SETUP.md
npm run prod:ghcr:up:https
```

Set `APP_URL` and `CORS_ORIGIN` to `https://...`.

**Backup / restore drill**

```bash
./database/backup/backup.sh
docker compose -f deployment/docker-compose.prod.ghcr.yml stop backend
./database/backup/restore.sh database/backup/archives/<file>.sql.gz
docker compose -f deployment/docker-compose.prod.ghcr.yml start backend
```

- [ ] Restore tested once on staging or a clone.

## 6. Release alignment

- [ ] GitHub Release tag (e.g. `v2.1.0`) matches GHCR image tags on the server.
- [ ] `GET /health` → `database: connected`.
- [ ] Document upgrade path for the customer: [UPGRADE.md](./UPGRADE.md), [GHCR.md](./GHCR.md).

## npm scripts reference

| Script | Purpose |
|--------|---------|
| `prod:ghcr:pull` / `prod:ghcr:up` | Embedded Postgres + Watchtower |
| `prod:ghcr:external:up` | External `DATABASE_URL` |
| `prod:ghcr:up:https` | GHCR stack + TLS nginx |
| `verify:go-live` | Health + setup status checks |
