import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getDbPool } from "./src/services/dbService";
import { registerApiRoutes } from "./src/server/registerApiRoutes";
import {
  ensureBaseSchema,
  ensureServerSchema,
} from "./src/server/persistence/store";
import { seedDevDataIfNeeded } from "./src/server/persistence/seed";
import { logger } from "./src/server/logger";
import { registerSecurityMiddleware } from "./src/server/middleware/security";
import { registerRequestLogger } from "./src/server/middleware/requestLogger";

async function startServer() {
  const pool = getDbPool();
  if (pool) {
    try {
      if (process.env.SKIP_SCHEMA_ENSURE !== "true") {
        await ensureBaseSchema();
        await ensureServerSchema();
      }
      if (process.env.NODE_ENV !== "production") {
        await seedDevDataIfNeeded();
      }
      logger.info("PostgreSQL persistence ready");
    } catch (err) {
      logger.warn({ err }, "database_init_warning");
    }
  } else {
    logger.warn("DATABASE_URL not set — API routes may return 503");
  }

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const apiOnly =
    process.env.API_ONLY === "true" || process.env.SERVE_STATIC === "false";

  app.use(express.json({ limit: "2mb" }));
  registerRequestLogger(app);
  registerSecurityMiddleware(app);
  registerApiRoutes(app);

  if (!apiOnly && process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!apiOnly) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info({ port: PORT, apiOnly }, "server_listening");
  });
}

startServer();
