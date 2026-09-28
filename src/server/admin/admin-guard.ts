import type { Request, Response } from "express";
import { extractJwtUser } from "../authHelpers";

export type AdminPermission =
  | "manage_organization_settings"
  | "manage_authentication_settings"
  | "manage_integrations"
  | "manage_system_settings";

const ROLE_PERMISSIONS: Record<string, AdminPermission[]> = {
  SUPER_ADMIN: [
    "manage_organization_settings",
    "manage_authentication_settings",
    "manage_integrations",
    "manage_system_settings",
  ],
  ORGANIZATION_ADMIN: [
    "manage_organization_settings",
    "manage_authentication_settings",
    "manage_integrations",
    "manage_system_settings",
  ],
  ORG_ADMIN: [
    "manage_organization_settings",
    "manage_authentication_settings",
    "manage_integrations",
    "manage_system_settings",
  ],
};

export function callerHasAdminPermission(role: string, permission: AdminPermission): boolean {
  const upper = role.toUpperCase();
  return ROLE_PERMISSIONS[upper]?.includes(permission) ?? false;
}

export function requireAdminPermission(
  req: Request,
  res: Response,
  permission: AdminPermission,
): { userId: string; organizationId: string; role: string } | null {
  const caller = extractJwtUser(req);
  if (!caller) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  if (!callerHasAdminPermission(caller.role, permission)) {
    res.status(403).json({ error: "Forbidden", message: "دسترسی به این تنظیمات مجاز نیست" });
    return null;
  }
  return caller;
}

export function assertOrgScope(
  caller: { organizationId: string; role: string },
  orgId: string,
  res: Response,
): boolean {
  if (caller.role.toUpperCase() === "SUPER_ADMIN") return true;
  if (caller.organizationId !== orgId) {
    res.status(403).json({ error: "Forbidden", message: "نقض حریم سازمان" });
    return false;
  }
  return true;
}
