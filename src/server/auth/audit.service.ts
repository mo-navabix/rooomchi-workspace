import { randomUUID } from "crypto";
import type { Request } from "express";
import { query } from "../persistence/db";
import type { AuthProviderId } from "./types";
import { getClientIp } from "./auth-context";
import { logger } from "../logger";

export type AuthAuditAction =
  | "login"
  | "login_failed"
  | "logout"
  | "register"
  | "password_reset"
  | "oauth_callback"
  | "ldap_login";

export async function writeAuthAudit(params: {
  req?: Request;
  userId?: string | null;
  organizationId?: string | null;
  provider: AuthProviderId;
  action: AuthAuditAction;
  success: boolean;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const id = `aud-${randomUUID()}`;
  const ip = params.req ? getClientIp(params.req) : null;
  const userAgent = params.req?.headers["user-agent"]?.toString() || null;
  try {
    await query(
      `INSERT INTO auth_audit_logs (
        id, user_id, organization_id, provider, action, success, ip_address, user_agent, metadata
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
      [
        id,
        params.userId || null,
        params.organizationId || null,
        params.provider,
        params.action,
        params.success,
        ip,
        userAgent,
        JSON.stringify(params.metadata || {}),
      ],
    );
  } catch (err) {
    logger.warn({ err }, "auth_audit_write_failed");
  }
}
