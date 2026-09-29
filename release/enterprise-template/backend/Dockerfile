# Pre-built API image — artifacts copied by scripts/build-enterprise-release.sh
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV API_ONLY=true
ENV SERVE_STATIC=false
ENV SKIP_SCHEMA_ENSURE=true

RUN addgroup -S rooomchi && adduser -S rooomchi -G rooomchi \
  && apk add --no-cache wget

COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY backend/dist/server.cjs backend/dist/migrate.cjs ./dist/
COPY schema.sql ./schema.sql
COPY schema ./schema
COPY database ./database

COPY backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER rooomchi
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/server.cjs"]
