import type { Request, Response, RequestHandler } from "express";
import { DbNotConfiguredError } from "./persistence/db";

export function asyncRoute(
  handler: (req: Request, res: Response) => Promise<void | Response>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch((err) => {
      if (err instanceof DbNotConfiguredError) {
        res.status(503).json({
          error: "DatabaseUnavailable",
          message: "اتصال به PostgreSQL برقرار نیست. دیتابیس را با npm run db:up بالا بیاورید.",
        });
        return;
      }
      console.error(err);
      res.status(500).json({ error: "Internal Server Error", message: err?.message || "خطای سرور" });
    });
  };
}

export function stripPassword<T extends { password?: string }>(user: T) {
  const { password: _, ...safe } = user;
  return safe;
}
