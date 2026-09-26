import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getDbPool } from "./src/services/dbService";
import { registerApiRoutes } from "./src/server/registerApiRoutes";
import { ensureServerSchema } from "./src/server/persistence/store";
import { seedDevDataIfNeeded } from "./src/server/persistence/seed";

async function startServer() {
  const pool = getDbPool();
  if (pool) {
    try {
      await ensureServerSchema();
      await seedDevDataIfNeeded();
      console.log("✅ API persistence: PostgreSQL");
    } catch (err) {
      console.warn("⚠️ Database init warning:", err);
    }
  } else {
    console.warn("⚠️ DATABASE_URL not set — API routes will return 503 until Postgres is configured.");
  }

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  registerApiRoutes(app);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enterprise Meeting Room Server running on http://localhost:${PORT}`);
  });
}

startServer();
