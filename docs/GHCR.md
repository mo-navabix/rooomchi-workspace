# GitHub Container Registry (GHCR)

Images for production deploy are published to **ghcr.io** by GitHub Actions (workflow [`.github/workflows/ghcr-publish.yml`](../.github/workflows/ghcr-publish.yml)).

| Image | Package name |
|--------|----------------|
| API (Express) | `rooomchi-backend` |
| SPA (nginx) | `rooomchi-frontend` |

Full image path (replace `OWNER` with your GitHub user or org, **lowercase**):

```text
ghcr.io/OWNER/rooomchi-backend:TAG
ghcr.io/OWNER/rooomchi-frontend:TAG
```

## Tags

| Event | Tags |
|--------|------|
| Push to `main` / `master` | `latest`, `main`, `sha-<commit>` |
| Git tag `v1.2.3` | `v1.2.3`, `1.2.3`, `1.2`, `sha-<commit>` |
| Manual workflow run | Same rules for the selected ref |

Prefer **immutable** tags (`v1.2.3` or `sha-…`) in production instead of `latest`.

## 1. Enable publishing (repository)

1. Push to `main` or create a **Release** / tag `v*`, or run **Actions → Publish to GHCR → Run workflow**.
2. In GitHub: **Packages** — confirm `rooomchi-backend` and `rooomchi-frontend` exist.
3. For **private** repos, packages are private by default. For **public** pull without login, set each package to **Public** (Package → Package settings → Change visibility).

Workflow permissions (usually default on GitHub.com):

- **Settings → Actions → General → Workflow permissions** → *Read and write permissions* (or fine-grained `packages: write` for `GITHUB_TOKEN`).

## 2. Create a token for `docker pull`

### Classic PAT (simple)

1. GitHub → **Settings → Developer settings → Personal access tokens → Tokens (classic)**.
2. **Generate new token (classic)**.
3. Scopes:
   - **`read:packages`** — pull images (servers / CI).
   - **`write:packages`** — only if you push from outside Actions.
4. Copy the token once; store it in your secret manager.

### Fine-grained PAT

1. **Settings → Developer settings → Fine-grained tokens → Generate**.
2. Resource owner: your user or org.
3. Repository access: this repo (or all repos that own the packages).
4. Permissions: **Packages → Read** (or Read and write).

### `GITHUB_TOKEN` in Actions

Other workflows in the same repo can pull with:

```yaml
- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

## 3. Log in on a server

```bash
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Use a **machine user** or deploy bot account for production if you prefer not to use personal accounts.

## 4. Pull and run

Production stack file: [`deployment/docker-compose.prod.ghcr.yml`](../deployment/docker-compose.prod.ghcr.yml) (Postgres + GHCR backend/frontend + edge nginx + optional Watchtower).

In `.env` (see [`.env.example`](../.env.example)):

```env
IMAGE_GHCR_BACKEND=ghcr.io/YOUR_GITHUB_USER/rooomchi-backend:v1.0.0
IMAGE_GHCR_FRONTEND=ghcr.io/YOUR_GITHUB_USER/rooomchi-frontend:v1.0.0
```

(`ROOOMCHI_BACKEND_IMAGE` / `ROOOMCHI_FRONTEND_IMAGE` still work as fallbacks.)

From repo root:

```bash
docker compose -f deployment/docker-compose.prod.ghcr.yml --env-file .env pull
docker compose -f deployment/docker-compose.prod.ghcr.yml --env-file .env --profile watchtower up -d
```

Or npm scripts:

```bash
npm run prod:ghcr:pull
npm run prod:ghcr:up          # stack + Watchtower
npm run prod:ghcr:up:stack    # without Watchtower
```

Postgres, nginx proxy, migrations on backend start, and healthchecks behave like [docker-compose.production.yml](../deployment/docker-compose.production.yml); only backend/frontend images come from GHCR.

**Customer handoff:** full checklist in [CUSTOMER_GO_LIVE.md](./CUSTOMER_GO_LIVE.md) (external DB, HTTPS, backup, security).

### Watchtower

- Service `watchtower` uses profile `watchtower` (enabled by `npm run prod:ghcr:up`).
- Only containers with label `com.centurylinklabs.watchtower.enable=true` are updated (**backend** and **frontend**).
- **Postgres**, **proxy**, and Watchtower itself are labeled `enable=false`.
- Default poll interval: `WATCHTOWER_POLL_INTERVAL` (seconds, default `86400`).
- Run `docker login ghcr.io` on the host so pulls succeed; optionally set `GHCR_USERNAME` / `GHCR_TOKEN` for Watchtower.
- Prefer **immutable** image tags (`v1.2.3`) in production; with `:latest`, Watchtower will roll forward on every GHCR publish.

## 5. Upgrade

1. Backup DB — [BACKUP.md](./BACKUP.md).
2. Set new tag in `.env` (e.g. `v1.1.0`).
3. `npm run prod:ghcr:pull` then `npm run prod:ghcr:up`.

## Troubleshooting

| Problem | What to check |
|---------|----------------|
| `denied` / `unauthorized` | `docker login ghcr.io`, PAT has `read:packages`, username is correct |
| `manifest unknown` | Tag exists on GitHub Packages; image name owner is lowercase |
| Private package | Package visibility or login required |
| Old containers | `pull_policy: always`; run `npm run prod:ghcr:pull` or let Watchtower pull |
| Watchtower restarts nothing | `WATCHTOWER_LABEL_ENABLE=true` and backend/frontend labels; check Watchtower logs |

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) still **builds** images locally without push (validation). Publishing is only in **Publish to GHCR**.
