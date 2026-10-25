# Backend (GHCR)

Production does **not** build from this folder.

Pull the published image configured in `config/.env`:

```text
IMAGE_GHCR_BACKEND=ghcr.io/<owner>/rooomchi-backend:<tag>
```

Image contents: Express API (`dist/server.cjs`), migrations (`dist/migrate.cjs`), `schema/`. Built from `deployment/backend/Dockerfile` in the application repository.
