# Frontend (GHCR)

Production does **not** build from this folder.

Pull the published image configured in `config/.env`:

```text
IMAGE_GHCR_FRONTEND=ghcr.io/<owner>/rooomchi-frontend:<tag>
```

The image serves the built SPA on **port 80** (nginx). Built from `deployment/frontend/Dockerfile` in the application repository.
