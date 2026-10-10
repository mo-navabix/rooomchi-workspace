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

export type AuthAuditListItem = {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  provider: string;
  action: string;
  success: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export async function listAuthAuditLogs(
  organizationId: string,
  limit = 50,
): Promise<AuthAuditListItem[]> {
  const { rows } = await query<Record<string, unknown>>(
    `SELECT a.*, u.first_name, u.last_name, u.email AS user_email_col
     FROM auth_audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE a.organization_id = $1
     ORDER BY a.created_at DESC
     LIMIT $2`,
    [organizationId, limit],
  );
  return rows.map((r) => {
    const first = r.first_name ? String(r.first_name) : "";
    const last = r.last_name ? String(r.last_name) : "";
    const name = `${first} ${last}`.trim();
    const meta =
      r.metadata && typeof r.metadata === "object"
        ? (r.metadata as Record<string, unknown>)
        : typeof r.metadata === "string"
          ? (JSON.parse(r.metadata) as Record<string, unknown>)
          : {};
    return {
      id: String(r.id),
      userId: r.user_id ? String(r.user_id) : null,
      userName: name || String(meta.username || "ناشناس"),
      userEmail: r.user_email_col
        ? String(r.user_email_col)
        : String(meta.email || meta.username || "—"),
      provider: String(r.provider || "local"),
      action: String(r.action),
      success: r.success === true || r.success === "t",
      ipAddress: r.ip_address ? String(r.ip_address) : null,
      userAgent: r.user_agent ? String(r.user_agent) : null,
      createdAt: new Date(String(r.created_at)).toISOString(),
      metadata: meta,
    };
  });
}
