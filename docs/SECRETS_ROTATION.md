# Secret rotation (if credentials were exposed)

Rotate immediately if `.env`, API keys, or database passwords appeared in Git history, tickets, or chat.

## What to rotate

| Secret | Where to set | Effect |
|--------|----------------|--------|
| `JWT_SECRET` | Server `.env` | All users must log in again |
| `SETUP_ENCRYPTION_KEY` | Server `.env` | Re-save LDAP/SMTP/OAuth secrets in admin UI |
| `POSTGRES_PASSWORD` | `.env` + `ALTER USER` in DB | Update `DATABASE_URL` / compose |
| `DATABASE_URL` password | Managed DB console | Update `.env`, restart backend |
| `GHCR_TOKEN` | Server `docker login`, Watchtower env | Revoke old PAT on GitHub |
| Supabase / cloud DB | Provider dashboard | Disable old password; never commit connection strings |
| `GEMINI_API_KEY`, SMTP, LDAP bind | `.env` or org integrations | Provider console |

## Git: stop tracking `.env`

```bash
git rm --cached .env
git commit -m "chore: stop tracking .env"
```

Local `.env` remains on disk; only removed from the repository index.

## Purging history (optional, disruptive)

If production secrets were pushed, rotating secrets is **required**. Removing files from history (`git filter-repo`, BFG) needs team coordination. Prefer rotation even after history rewrite.

## New production secrets

```bash
# Example (Linux/macOS)
openssl rand -base64 48   # JWT_SECRET / SETUP_ENCRYPTION_KEY
```

Update server `.env`, restart:

```bash
npm run prod:ghcr:down
npm run prod:ghcr:up
```
