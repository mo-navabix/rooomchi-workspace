import { randomUUID } from "crypto";
import { query } from "./db";

export type SupportTicketRow = {
  id: string;
  organization_id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  subject: string;
  category: string;
  priority: string;
  description: string;
  contact_phone: string | null;
  status: string;
  admin_note: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export type SupportTicketDto = {
  id: string;
  orgId: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  contactPhone?: string;
  status: "open" | "in_progress" | "resolved";
  adminNote?: string;
  createdAt: string;
  updatedAt?: string;
};

function mapRow(row: SupportTicketRow): SupportTicketDto {
  return {
    id: row.id,
    orgId: row.organization_id,
    userId: row.user_id || undefined,
    userEmail: row.user_email || undefined,
    userName: row.user_name || undefined,
    subject: row.subject,
    category: row.category,
    priority: row.priority,
    description: row.description,
    contactPhone: row.contact_phone || undefined,
    status: row.status as SupportTicketDto["status"],
    adminNote: row.admin_note || undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

export async function listSupportTicketsForUser(
  organizationId: string,
  userId: string,
): Promise<SupportTicketDto[]> {
  const { rows } = await query<SupportTicketRow>(
    `SELECT * FROM support_tickets
     WHERE organization_id = $1 AND user_id = $2
     ORDER BY created_at DESC`,
    [organizationId, userId],
  );
  return rows.map(mapRow);
}

export async function listSupportTicketsForOrg(organizationId: string): Promise<SupportTicketDto[]> {
  const { rows } = await query<SupportTicketRow>(
    `SELECT * FROM support_tickets WHERE organization_id = $1 ORDER BY created_at DESC`,
    [organizationId],
  );
  return rows.map(mapRow);
}

export async function insertSupportTicket(params: {
  organizationId: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  contactPhone?: string;
}): Promise<SupportTicketDto> {
  const id = `TKT-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  const { rows } = await query<SupportTicketRow>(
    `INSERT INTO support_tickets (
      id, organization_id, user_id, user_email, user_name,
      subject, category, priority, description, contact_phone, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'open')
    RETURNING *`,
    [
      id,
      params.organizationId,
      params.userId,
      params.userEmail,
      params.userName,
      params.subject,
      params.category,
      params.priority,
      params.description,
      params.contactPhone || null,
    ],
  );
  return mapRow(rows[0]);
}

export async function getSupportTicket(
  organizationId: string,
  ticketId: string,
): Promise<SupportTicketDto | null> {
  const { rows } = await query<SupportTicketRow>(
    `SELECT * FROM support_tickets WHERE id = $1 AND organization_id = $2 LIMIT 1`,
    [ticketId, organizationId],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function patchSupportTicket(
  organizationId: string,
  ticketId: string,
  patch: { status?: string; adminNote?: string; priority?: string },
): Promise<SupportTicketDto | null> {
  const current = await getSupportTicket(organizationId, ticketId);
  if (!current) return null;
  const status = patch.status ?? current.status;
  const adminNote = patch.adminNote !== undefined ? patch.adminNote : current.adminNote;
  const priority = patch.priority ?? current.priority;
  const { rows } = await query<SupportTicketRow>(
    `UPDATE support_tickets SET status = $3, admin_note = $4, priority = $5, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2 RETURNING *`,
    [ticketId, organizationId, status, adminNote || null, priority],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}
