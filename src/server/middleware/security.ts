import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { logger } from "../logger";

function parseCorsOrigins(): string[] | boolean {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw || raw === "*") {
    if (process.env.NODE_ENV === "production") {
      logger.warn("CORS_ORIGIN not set in production — allowing configured APP_URL only");
      const appUrl = process.env.APP_URL?.trim();
      return appUrl ? [appUrl] : false;
    }
    return true;
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function registerSecurityMiddleware(app: Express): void {
  const origins = parseCorsOrigins();
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origins === true) {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    } else if (Array.isArray(origins) && origin && origins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else if (Array.isArray(origins) && origins.length === 1 && !origin) {
      res.setHeader("Access-Control-Allow-Origin", origins[0]);
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With",
    );
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
  const max = Number(process.env.RATE_LIMIT_MAX) || 300;
  app.use(
    "/api",
    rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many requests" },
    }),
  );

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
      );
    }
    next();
  });
}
