import type { Express } from "express";
import { asyncRoute } from "../http";
import { requireAdminPermission } from "../admin/admin-guard";
import { getAppVersionInfo } from "./version";
import { evaluateLicenseStatus } from "./license.service";
import { getUpdateManagementSnapshot } from "./migrations-info.service";

export function registerEnterpriseRoutes(app: Express): void {
  app.get("/api/enterprise/version", asyncRoute(async (_req, res) => {
    res.json(getAppVersionInfo());
  }));

  app.get("/api/admin/enterprise/platform", asyncRoute(async (req, res) => {
    const ctx = requireAdminPermission(req, res, "manage_system_settings");
    if (!ctx) return;
    const [license, updates] = await Promise.all([
      Promise.resolve(evaluateLicenseStatus()),
      getUpdateManagementSnapshot(),
    ]);
    res.json({
      version: getAppVersionInfo(),
      license,
      updates,
    });
  }));
}
