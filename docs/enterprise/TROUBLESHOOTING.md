# Troubleshooting

| Symptom | Check |
|---------|--------|
| `/setup` 403 | Installation already complete; use login or `setup:reset` (dev) |
| DB unhealthy | `DATABASE_URL`, postgres health, firewall |
| 401 on admin API | JWT expired; org admin role |
| OAuth redirect error | `APP_URL`, Google redirect URI, HTTPS mismatch |
| Upload fails | `UPLOAD_PATH` permissions in container volume |
| License warning | `config/license.json` missing or expired |

Logs:

```bash
docker compose logs -f backend
docker compose logs -f nginx
```

Preflight during install: `GET /api/setup/preflight`
