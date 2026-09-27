import { jwtService } from "../authHelpers";
import { stripPassword } from "../http";
import type { User } from "../types";
import type { AuthLoginResult } from "./types";
import * as store from "../persistence/store";

export async function issueSessionForUser(user: User, message?: string): Promise<AuthLoginResult> {
  if (user.status === "SUSPENDED" || user.status === "suspended") {
    throw Object.assign(new Error("حساب کاربری معلق شده است"), { statusCode: 403 });
  }
  if (user.status === "INACTIVE") {
    throw Object.assign(new Error("حساب کاربری غیرفعال است"), { statusCode: 403 });
  }

  const nowIso = new Date().toISOString();
  await store.updateUser(user.id, { lastLoginAt: nowIso, lastLogin: nowIso });
  const orgId = user.organizationId || user.orgId || "org-1";
  const role = (user.role || "EMPLOYEE").toString().toUpperCase();
  const token = jwtService.sign({ userId: user.id, organizationId: orgId, role });
  const safeUser = stripPassword(user);

  return {
    accessToken: token,
    token,
    tokenType: "Bearer",
    requiresPasswordChange: user.status === "INVITED",
    isProfileComplete: user.isProfileComplete ?? true,
    user: { ...safeUser, organizationId: orgId, role },
    message: message || `خوش آمدید، ${user.firstName || user.name || user.email}`,
  };
}
