# Pre-built static SPA — dist assembled by scripts/build-enterprise-release.sh
FROM nginx:1.27-alpine AS runner
COPY frontend/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY frontend/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1
