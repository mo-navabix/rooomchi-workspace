# Enterprise initial setup wizard (self-hosted)

## Behavior

| State | Browser | API |
|--------|---------|-----|
| Fresh DB (`installation_status.initialized = false`) | `/setup` wizard | `/api/setup/*` enabled |
| After completion | Normal landing / login | `/api/setup/*` returns **403** |

Demo seed (`seedDevDataIfNeeded`) is **skipped** until installation is marked complete.

## Database

Applied via `schema/03-installation-setup.sql` (and `database/migrations/000004_installation_setup.sql`):

- **`installation_status`** — single row `id = default`, flags `initialized`, `organization_created`, `admin_created`, `completed_at`
- **`integrations`** — per-org `smtp` and `storage` config (secrets encrypted in JSON)

Existing databases with organizations + users are auto-marked `initialized = true` on migration.

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/setup/status` | Public installation state |
| POST | `/api/setup/test-ldap` | LDAP bind + base search (setup only) |
| POST | `/api/setup/test-google` | Validate OAuth fields (setup only) |
| POST | `/api/setup/test-smtp` | TCP connect to SMTP host (setup only) |
| POST | `/api/setup/complete` | Create org, SUPER_ADMIN, auth settings, integrations, mark complete, return JWT |

## Security

- Setup routes refuse requests once `initialized = true`.
- LDAP bind passwords, Google client secrets, and SMTP passwords are stored with **AES-256-GCM** (`SETUP_ENCRYPTION_KEY` or `JWT_SECRET`).
- Setup actions are written to **`auth_audit_logs`** with `metadata.setup = true`.

## Frontend

- `SetupWizardView` — 8 steps at `viewMode === 'setup'`, URL `/setup`.
- `AppContext` checks `/api/setup/status` on boot and redirects uninitialized installs to the wizard.
- **راهنمای فیلدها (PDF):** از صفحهٔ خوش‌آمدگوی setup لینک «دانلود راهنمای PDF» — فایل `public/docs/setup-field-guide.pdf` (منبع HTML: `public/docs/setup-field-guide.html`). بازتولید: `npm run docs:setup-pdf`

## Post-install admin

- **Organization:** `admin-settings`
- **Authentication:** `access-control` + `organization_auth_settings`
- **SMTP / storage:** `integrations` table (admin UI extension planned; values set during wizard)

## Integration manager

`src/server/integrations/integration-manager.ts` — registry for LDAP/Google/SMTP tests and persistence (extend for S3/MinIO later).

## Docker first run

```bash
docker compose up -d
# open http://<host>  → wizard
# after complete → restart → login page
```

Set strong `JWT_SECRET` and `SETUP_ENCRYPTION_KEY` in production `.env`.
