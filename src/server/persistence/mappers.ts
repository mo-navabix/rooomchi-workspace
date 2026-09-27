import type { Booking, Organization, Room, User } from "../types";
import { normalizeUserRole, normalizeUserStatus } from "../../constants/rbac";
import { formatGregorianIsoLocal } from "../../utils/jalali";

/** Map Postgres `date` / API values to YYYY-MM-DD without UTC day shift. */
export function toIsoDate(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return formatGregorianIsoLocal(value);
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return formatGregorianIsoLocal(parsed);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

export function toIsoDateTime(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function toApiRole(role: string): string {
  const r = (role || "employee").toLowerCase();
  const map: Record<string, string> = {
    super_admin: "SUPER_ADMIN",
    org_admin: "ORGANIZATION_ADMIN",
    organization_admin: "ORGANIZATION_ADMIN",
    room_manager: "MANAGER",
    manager: "MANAGER",
    employee: "EMPLOYEE",
  };
  return map[r] || role.toUpperCase();
}

export function toDbRole(role: string): string {
  const r = role.toUpperCase();
  const map: Record<string, string> = {
    SUPER_ADMIN: "super_admin",
    ORGANIZATION_ADMIN: "org_admin",
    ORG_ADMIN: "org_admin",
    MANAGER: "manager",
    ROOM_MANAGER: "room_manager",
    EMPLOYEE: "employee",
  };
  return map[r] || role.toLowerCase();
}

export function mapOrganizationRow(row: Record<string, unknown>): Organization {
  return {
    id: String(row.id),
    name: String(row.name),
    code: String(row.code),
    domain: row.domain ? String(row.domain) : undefined,
    status: String(row.status || "ACTIVE"),
    createdAt: toIsoDateTime(row.created_at),
    updatedAt: toIsoDateTime(row.updated_at),
    slug: row.slug ? String(row.slug) : undefined,
    logo: row.logo ? String(row.logo) : undefined,
    primaryColor: row.primary_color ? String(row.primary_color) : undefined,
    plan: row.plan ? String(row.plan) : undefined,
    contactEmail: row.contact_email ? String(row.contact_email) : undefined,
    buildings: parseJsonArray(row.buildings),
    departments: parseJsonArray(row.departments),
    workHours: (row.work_hours as Organization["workHours"]) || undefined,
    settings: (row.settings as Organization["settings"]) || undefined,
  };
}

export function mapRoomRow(row: Record<string, unknown>): Room {
  const status = String(row.status || "available");
  return {
    id: String(row.id),
    orgId: String(row.organization_id),
    name: String(row.name),
    code: String(row.code),
    floor: Number(row.floor) || 1,
    building: String(row.building),
    capacity: Number(row.capacity) || 0,
    amenities: parseJsonArray(row.amenities),
    imageUrl: row.image_url ? String(row.image_url) : "",
    status: status as Room["status"],
    color: row.color ? String(row.color) : "#2563eb",
    hourlyRate: row.hourly_rate != null ? Number(row.hourly_rate) : undefined,
    requiresApproval: Boolean(row.requires_approval),
  };
}

export function mapBookingRow(row: Record<string, unknown>, roomName?: string): Booking {
  return {
    id: String(row.id),
    orgId: String(row.organization_id),
    roomId: String(row.room_id),
    roomName: roomName || (row.room_name ? String(row.room_name) : ""),
    title: String(row.title),
    description: row.description ? String(row.description) : "",
    organizerName: String(row.organizer_name),
    organizerEmail: String(row.organizer_email),
    department: row.department ? String(row.department) : "عمومی",
    date: toIsoDate(row.date),
    startTime: String(row.start_time),
    endTime: String(row.end_time),
    attendeesCount: Number(row.attendees_count) || 1,
    attendeeEmails: parseJsonArray(row.attendee_emails),
    equipmentNeeded: parseJsonArray(row.equipment),
    cateringNeeded: Boolean(row.catering),
    status: String(row.status) as Booking["status"],
    createdAt: toIsoDateTime(row.created_at),
  };
}

export function mapUserRow(row: Record<string, unknown>, orgName?: string): User {
  const firstName = String(row.first_name || "");
  const lastName = String(row.last_name || "");
  const name = `${firstName} ${lastName}`.trim();
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    orgId: String(row.organization_id),
    employeeNumber: row.employee_number ? String(row.employee_number) : "",
    firstName,
    lastName,
    name: name || String(row.email),
    email: String(row.email),
    password: row.password_hash ? String(row.password_hash) : undefined,
    status: normalizeUserStatus(String(row.status || "ACTIVE")),
    role: normalizeUserRole(String(row.role || "employee")),
    lastLoginAt: row.last_login_at ? toIsoDateTime(row.last_login_at) : null,
    lastLogin: row.last_login_at ? toIsoDateTime(row.last_login_at) : undefined,
    createdAt: toIsoDateTime(row.created_at),
    updatedAt: row.updated_at ? toIsoDateTime(row.updated_at) : undefined,
    department: row.department ? String(row.department) : undefined,
    jobTitle: row.job_title ? String(row.job_title) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    orgName,
    isProfileComplete: row.is_profile_complete !== false && row.is_profile_complete !== null
      ? Boolean(row.is_profile_complete)
      : true,
    isPermanentAdmin: Boolean(row.is_permanent_admin),
  };
}
