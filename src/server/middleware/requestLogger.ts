import type { Express } from "express";
import { randomUUID } from "crypto";
import { logger } from "../logger";

export function registerRequestLogger(app: Express): void {
  app.use((req, res, next) => {
    const requestId = (req.headers["x-request-id"] as string) || randomUUID();
    res.setHeader("X-Request-Id", requestId);
    const start = Date.now();
    res.on("finish", () => {
      const durationMs = Date.now() - start;
      if (req.path === "/health" || req.path === "/api/health") return;
      logger.info(
        {
          requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs,
        },
        "http_request",
      );
    });
    next();
  });
}
