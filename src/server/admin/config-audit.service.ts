import { randomUUID } from "crypto";
import type { Request } from "express";
import { query } from "../persistence/db";
import { getClientIp } from "../auth/auth-context";

export type ConfigAuditEventType =
  | "ORGANIZATION_UPDATED"
  | "AUTH_PROVIDER_UPDATED"
  | "INTEGRATION_UPDATED"
  | "SYSTEM_SETTING_UPDATED";

export async function writeConfigAudit(params: {
  req?: Request;
  organizationId: string;
  userId?: string | null;
  eventType: ConfigAuditEventType;
  summary: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}): Promise<void> {
  const id = `cfg-aud-${randomUUID()}`;
  const ip = params.req ? getClientIp(params.req) : null;
  await query(
    `INSERT INTO config_audit_logs (
      id, organization_id, user_id, event_type, summary, before_state, after_state, ip_address
    ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8)`,
    [
      id,
      params.organizationId,
      params.userId || null,
      params.eventType,
      params.summary,
      JSON.stringify(params.before || {}),
      JSON.stringify(params.after || {}),
      ip,
    ],
  );
}

export async function listConfigAuditLogs(organizationId: string, limit = 30) {
  const { rows } = await query(
    `SELECT c.*, u.first_name, u.last_name, u.email
     FROM config_audit_logs c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.organization_id = $1
     ORDER BY c.created_at DESC
     LIMIT $2`,
    [organizationId, limit],
  );
  return rows.map((r) => ({
    id: String(r.id),
    eventType: String(r.event_type),
    summary: String(r.summary || ""),
    before: r.before_state,
    after: r.after_state,
    createdAt: String(r.created_at),
    userName: [r.first_name, r.last_name].filter(Boolean).join(" ") || "سیستم",
    userEmail: r.email ? String(r.email) : undefined,
  }));
}
