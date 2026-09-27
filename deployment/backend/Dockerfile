# Rooomchi API — production image (Express + PostgreSQL)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs \
  && npx esbuild scripts/migrate-cli.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/migrate.cjs \
  && npx esbuild scripts/seed-cli.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/seed.cjs

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV API_ONLY=true
ENV SERVE_STATIC=false
ENV SKIP_SCHEMA_ENSURE=true

RUN addgroup -S rooomchi && adduser -S rooomchi -G rooomchi

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY schema.sql ./schema.sql
COPY schema ./schema
COPY database ./database

COPY deployment/backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER rooomchi
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/server.cjs"]
