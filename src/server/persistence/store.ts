import fs from "fs";
import path from "path";
import type { Booking, Organization, Room, TeamMemberRecord, TeamRecord, User, VerificationPurpose } from "../types";
import { query } from "./db";
import { runSqlFile } from "./sql-runner";
import { formatGregorianIsoLocal } from "../../utils/jalali";
import {
  mapBookingRow,
  mapOrganizationRow,
  mapRoomRow,
  mapUserRow,
  toApiRole,
  toDbRole,
  toIsoDate,
} from "./mappers";

export async function usersTableExists(): Promise<boolean> {
  try {
    const { rows } = await query<{ t: string | null }>(
      "SELECT to_regclass('public.users')::text AS t",
    );
    return Boolean(rows[0]?.t);
  } catch {
    return false;
  }
}

async function organizationsTableExists(): Promise<boolean> {
  try {
    const { rows } = await query<{ t: string | null }>(
      "SELECT to_regclass('public.organizations')::text AS t",
    );
    return Boolean(rows[0]?.t);
  } catch {
    return false;
  }
}

/** Applies schema.sql when the database volume is empty (no docker init scripts). */
export async function ensureBaseSchema(): Promise<void> {
  if (await usersTableExists()) return;

  const repairPath = path.join(process.cwd(), "schema", "01-repair-core-tables.sql");
  if ((await organizationsTableExists()) && fs.existsSync(repairPath)) {
    console.log("📦 Repairing missing core tables (users, rooms, bookings)…");
    await runSqlFile("schema/01-repair-core-tables.sql");
    console.log("✅ Core tables repaired.");
    return;
  }

  const basePath = path.join(process.cwd(), "schema.sql");
  if (!fs.existsSync(basePath)) {
    throw new Error("schema.sql not found — cannot bootstrap database");
  }
  console.log("📦 Applying base schema (schema.sql)…");
  await runSqlFile("schema.sql");
  console.log("✅ Base schema applied.");
}

let orgLogoColumnMigrated = false;

/** Expand organizations.logo from VARCHAR(32) to TEXT (idempotent). */
export async function ensureOrgLogoColumnIsText(): Promise<void> {
  if (orgLogoColumnMigrated) return;
  if (!(await organizationsTableExists())) return;
  await query(`ALTER TABLE organizations ALTER COLUMN logo TYPE TEXT`);
  orgLogoColumnMigrated = true;
}

export async function ensureServerSchema(): Promise<void> {
  await ensureOrgLogoColumnIsText();
  const extensionsPath = path.join(process.cwd(), "schema", "02-server-extensions.sql");
  if (fs.existsSync(extensionsPath)) {
    await runSqlFile("schema/02-server-extensions.sql");
  }
  const installPath = path.join(process.cwd(), "schema", "03-installation-setup.sql");
  if (fs.existsSync(installPath)) {
    await runSqlFile("schema/03-installation-setup.sql");
  }
  const adminPath = path.join(process.cwd(), "schema", "04-admin-settings.sql");
  if (fs.existsSync(adminPath)) {
    await runSqlFile("schema/04-admin-settings.sql");
  }
  const notifPath = path.join(process.cwd(), "schema", "05-user-notifications.sql");
  if (fs.existsSync(notifPath)) {
    await runSqlFile("schema/05-user-notifications.sql");
  }
  const logoPath = path.join(process.cwd(), "schema", "06-org-logo-text.sql");
  if (fs.existsSync(logoPath)) {
    await runSqlFile("schema/06-org-logo-text.sql");
  }
  const apiDataPath = path.join(process.cwd(), "schema", "07-support-tickets-and-notifications.sql");
  if (fs.existsSync(apiDataPath)) {
    await runSqlFile("schema/07-support-tickets-and-notifications.sql");
  }
}

// --- Organizations ---

export async function listOrganizations(): Promise<Organization[]> {
  const { rows } = await query("SELECT * FROM organizations ORDER BY created_at ASC");
  return rows.map((r) => mapOrganizationRow(r));
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  const { rows } = await query("SELECT * FROM organizations WHERE id = $1", [id]);
  return rows[0] ? mapOrganizationRow(rows[0]) : null;
}

export async function findOrganizationBySlugOrCode(slugOrCode: string): Promise<Organization | null> {
  const key = slugOrCode.trim().toLowerCase();
  const { rows } = await query(
    `SELECT * FROM organizations
     WHERE LOWER(slug) = $1 OR LOWER(code) = $1 OR LOWER(code) = $2`,
    [key, slugOrCode.trim().toUpperCase()],
  );
  return rows[0] ? mapOrganizationRow(rows[0]) : null;
}

export async function organizationCodeExists(code: string): Promise<boolean> {
  const { rows } = await query("SELECT 1 FROM organizations WHERE UPPER(code) = $1 LIMIT 1", [
    code.trim().toUpperCase(),
  ]);
  return rows.length > 0;
}

export async function createOrganization(
  org: Organization,
  initialRooms: Partial<Room>[] = [],
): Promise<Organization> {
  await query(
    `INSERT INTO organizations (
      id, name, code, domain, status, slug, logo, primary_color, plan, contact_email,
      buildings, departments, work_hours, settings, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13::jsonb,$14::jsonb,$15,$16)`,
    [
      org.id,
      org.name,
      org.code,
      org.domain || null,
      org.status,
      org.slug || null,
      org.logo || "🏢",
      org.primaryColor || "#2563eb",
      org.plan || "business",
      org.contactEmail || null,
      JSON.stringify(org.buildings || []),
      JSON.stringify(org.departments || []),
      JSON.stringify(org.workHours || { start: "08:00", end: "19:00" }),
      JSON.stringify(org.settings || { autoApprove: true, maxBookingHours: 4, allowWeekend: false }),
      org.createdAt,
      org.updatedAt,
    ],
  );

  for (let i = 0; i < initialRooms.length; i++) {
    const r = initialRooms[i];
    await createRoom({
      id: `room-${Date.now()}-${i}`,
      orgId: org.id,
      name: r.name || `اتاق جلسات ${i + 1}`,
      code: r.code || `RM-${101 + i}`,
      floor: Number(r.floor) || 1,
      building: r.building || org.buildings?.[0] || "ساختمان مرکزی",
      capacity: Number(r.capacity) || 8,
      amenities: r.amenities || ["wifi", "whiteboard"],
      imageUrl:
        r.imageUrl ||
        "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop&q=80",
      status: "available",
      color: r.color || org.primaryColor || "#2563eb",
      requiresApproval: !!r.requiresApproval,
    });
  }

  return org;
}

export async function patchOrganization(id: string, patch: Partial<Organization>): Promise<Organization | null> {
  if (patch.logo !== undefined && patch.logo !== null) {
    await ensureOrgLogoColumnIsText();
  }
  const existing = await getOrganizationById(id);
  if (!existing) return null;
  const mergedSettings =
    patch.settings != null
      ? { ...(existing.settings || {}), ...patch.settings }
      : existing.settings;
  const merged = {
    ...existing,
    ...patch,
    settings: mergedSettings,
    updatedAt: new Date().toISOString(),
  };
  await query(
    `UPDATE organizations SET
      name = COALESCE($2, name),
      code = COALESCE($3, code),
      domain = COALESCE($4, domain),
      status = COALESCE($5, status),
      slug = COALESCE($6, slug),
      logo = COALESCE($7, logo),
      primary_color = COALESCE($8, primary_color),
      plan = COALESCE($9, plan),
      contact_email = COALESCE($10, contact_email),
      buildings = COALESCE($11::jsonb, buildings),
      departments = COALESCE($12::jsonb, departments),
      work_hours = COALESCE($13::jsonb, work_hours),
      settings = COALESCE($14::jsonb, settings),
      updated_at = $15
    WHERE id = $1`,
    [
      id,
      merged.name,
      merged.code,
      merged.domain,
      merged.status,
      merged.slug,
      merged.logo,
      merged.primaryColor,
      merged.plan,
      merged.contactEmail,
      merged.buildings ? JSON.stringify(merged.buildings) : null,
      merged.departments ? JSON.stringify(merged.departments) : null,
      merged.workHours ? JSON.stringify(merged.workHours) : null,
      merged.settings ? JSON.stringify(merged.settings) : null,
      merged.updatedAt,
    ],
  );
  return getOrganizationById(id);
}

// --- Rooms ---

export async function listRooms(filters: {
  orgId?: string;
  capacity?: number;
  floor?: number;
  building?: string;
  status?: string;
  amenity?: string;
}): Promise<Room[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  if (filters.orgId) {
    clauses.push(`organization_id = $${i++}`);
    params.push(filters.orgId);
  }
  if (filters.capacity != null) {
    clauses.push(`capacity >= $${i++}`);
    params.push(filters.capacity);
  }
  if (filters.floor != null) {
    clauses.push(`floor = $${i++}`);
    params.push(filters.floor);
  }
  if (filters.building) {
    clauses.push(`building = $${i++}`);
    params.push(filters.building);
  }
  if (filters.status) {
    clauses.push(`status = $${i++}`);
    params.push(filters.status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const { rows } = await query(`SELECT * FROM rooms ${where} ORDER BY name ASC`, params);
  let rooms = rows.map((r) => mapRoomRow(r));
  if (filters.amenity) {
    rooms = rooms.filter((r) => r.amenities.includes(String(filters.amenity)));
  }
  return rooms;
}

export async function getRoomById(id: string): Promise<Room | null> {
  const { rows } = await query("SELECT * FROM rooms WHERE id = $1", [id]);
  return rows[0] ? mapRoomRow(rows[0]) : null;
}

export async function createRoom(room: Room): Promise<Room> {
  await query(
    `INSERT INTO rooms (
      id, organization_id, name, code, floor, building, capacity, amenities, status, color,
      hourly_rate, image_url, description, requires_approval
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14)`,
    [
      room.id,
      room.orgId,
      room.name,
      room.code,
      room.floor,
      room.building,
      room.capacity,
      JSON.stringify(room.amenities || []),
      room.status || "available",
      room.color || "#3b82f6",
      room.hourlyRate ?? 0,
      room.imageUrl || null,
      null,
      room.requiresApproval ?? false,
    ],
  );
  return room;
}

export async function updateRoom(id: string, patch: Partial<Room>): Promise<Room | null> {
  const existing = await getRoomById(id);
  if (!existing) return null;
  const merged = { ...existing, ...patch };
  await query(
    `UPDATE rooms SET
      name = $2, code = $3, floor = $4, building = $5, capacity = $6,
      amenities = $7::jsonb, status = $8, color = $9, image_url = $10,
      requires_approval = $11, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1`,
    [
      id,
      merged.name,
      merged.code,
      merged.floor,
      merged.building,
      merged.capacity,
      JSON.stringify(merged.amenities),
      merged.status,
      merged.color,
      merged.imageUrl,
      merged.requiresApproval ?? false,
    ],
  );
  return getRoomById(id);
}

export async function deleteRoom(id: string): Promise<boolean> {
  const { rowCount } = await query("DELETE FROM rooms WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}

// --- Bookings ---

export async function listBookings(filters: {
  orgId?: string;
  roomId?: string;
  date?: string;
  department?: string;
  status?: string;
  forUser?: { id?: string; email?: string };
}): Promise<Booking[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  if (filters.orgId) {
    clauses.push(`b.organization_id = $${i++}`);
    params.push(filters.orgId);
  }
  if (filters.roomId) {
    clauses.push(`b.room_id = $${i++}`);
    params.push(filters.roomId);
  }
  if (filters.date) {
    clauses.push(`b.date = $${i++}`);
    params.push(filters.date);
  }
  if (filters.department) {
    clauses.push(`b.department = $${i++}`);
    params.push(filters.department);
  }
  if (filters.status) {
    clauses.push(`b.status = $${i++}`);
    params.push(filters.status);
  }
  if (filters.forUser) {
    const { id, email } = filters.forUser;
    const parts: string[] = [];
    if (id) {
      parts.push(`b.organizer_id = $${i}`);
      params.push(id);
      i++;
    }
    if (email?.trim()) {
      const emailParam = email.trim().toLowerCase();
      parts.push(`LOWER(b.organizer_email) = $${i}`);
      params.push(emailParam);
      i++;
      parts.push(
        `EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(COALESCE(b.attendee_emails, '[]'::jsonb)) AS ae(val)
          WHERE LOWER(ae.val) = $${i}
        )`,
      );
      params.push(emailParam);
      i++;
    }
    if (parts.length > 0) {
      clauses.push(`(${parts.join(" OR ")})`);
    }
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const { rows } = await query(
    `SELECT b.*, r.name AS room_name FROM bookings b
     LEFT JOIN rooms r ON r.id = b.room_id
     ${where}
     ORDER BY b.date ASC, b.start_time ASC`,
    params,
  );
  return rows.map((r) => mapBookingRow(r, r.room_name ? String(r.room_name) : undefined));
}

export async function hasBookingConflict(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
): Promise<boolean> {
  const { rows } = await query(
    `SELECT 1 FROM bookings
     WHERE room_id = $1 AND date = $2::date AND status <> 'cancelled'
       AND start_time < $4 AND end_time > $3
     LIMIT 1`,
    [roomId, date, startTime, endTime],
  );
  return rows.length > 0;
}

export async function createBooking(
  booking: Booking,
  options?: { organizerId?: string | null },
): Promise<Booking> {
  await query(
    `INSERT INTO bookings (
      id, organization_id, room_id, title, description, organizer_name, organizer_email,
      organizer_id, date, start_time, end_time, attendees_count, status, equipment,
      catering, department, attendee_emails, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::date,$10,$11,$12,$13,$14::jsonb,$15,$16,$17::jsonb,$18,$19)`,
    [
      booking.id,
      booking.orgId,
      booking.roomId,
      booking.title,
      booking.description || "",
      booking.organizerName,
      booking.organizerEmail,
      options?.organizerId ?? null,
      booking.date,
      booking.startTime,
      booking.endTime,
      booking.attendeesCount,
      booking.status,
      JSON.stringify(booking.equipmentNeeded || []),
      booking.cateringNeeded,
      booking.department || "عمومی",
      JSON.stringify(booking.attendeeEmails || []),
      booking.createdAt,
      booking.createdAt,
    ],
  );
  return booking;
}

export async function updateBookingStatus(id: string, status: Booking["status"]): Promise<Booking | null> {
  const { rows } = await query(
    `UPDATE bookings SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1
     RETURNING *`,
    [id, status],
  );
  if (!rows[0]) return null;
  const room = await getRoomById(String(rows[0].room_id));
  return mapBookingRow(rows[0], room?.name);
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const { rows } = await query(
    `SELECT b.*, r.name AS room_name FROM bookings b
     LEFT JOIN rooms r ON r.id = b.room_id
     WHERE b.id = $1`,
    [id],
  );
  if (!rows[0]) return null;
  return mapBookingRow(
    rows[0] as Record<string, unknown>,
    rows[0].room_name ? String(rows[0].room_name) : undefined,
  );
}

export async function cancelBooking(id: string): Promise<Booking | null> {
  return updateBookingStatus(id, "cancelled");
}

// --- Users ---

async function orgNameFor(orgId: string): Promise<string | undefined> {
  const org = await getOrganizationById(orgId);
  return org?.name;
}

export async function listUsers(filters: { orgId?: string }): Promise<User[]> {
  let sql = "SELECT u.* FROM users u";
  const params: unknown[] = [];
  if (filters.orgId) {
    sql += " WHERE u.organization_id = $1";
    params.push(filters.orgId);
  }
  sql += " ORDER BY u.created_at ASC";
  const { rows } = await query(sql, params);
  const users: User[] = [];
  for (const row of rows) {
    const orgName = row.organization_id ? await orgNameFor(String(row.organization_id)) : undefined;
    users.push(mapUserRow(row, orgName));
  }
  return users;
}

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [id]);
  if (!rows[0]) return null;
  const orgName = rows[0].organization_id
    ? await orgNameFor(String(rows[0].organization_id))
    : undefined;
  return mapUserRow(rows[0], orgName);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await query("SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1", [
    email.trim().toLowerCase(),
  ]);
  if (!rows[0]) return null;
  const orgName = rows[0].organization_id
    ? await orgNameFor(String(rows[0].organization_id))
    : undefined;
  return mapUserRow(rows[0], orgName);
}

export async function findUserByEmployeeNumber(orgId: string, employeeNumber: string): Promise<User | null> {
  const { rows } = await query(
    `SELECT * FROM users WHERE organization_id = $1
     AND LOWER(TRIM(employee_number)) = $2 LIMIT 1`,
    [orgId, employeeNumber.trim().toLowerCase()],
  );
  if (!rows[0]) return null;
  const orgName = await orgNameFor(orgId);
  return mapUserRow(rows[0], orgName);
}

export async function emailExists(email: string): Promise<boolean> {
  const { rows } = await query("SELECT 1 FROM users WHERE LOWER(email) = $1 LIMIT 1", [
    email.trim().toLowerCase(),
  ]);
  return rows.length > 0;
}

export async function employeeNumberExistsInOrg(orgId: string, employeeNumber: string): Promise<boolean> {
  const { rows } = await query(
    `SELECT 1 FROM users WHERE organization_id = $1 AND LOWER(TRIM(employee_number)) = $2 LIMIT 1`,
    [orgId, employeeNumber.trim().toLowerCase()],
  );
  return rows.length > 0;
}

export async function insertUser(user: User): Promise<User> {
  await query(
    `INSERT INTO users (
      id, organization_id, employee_number, first_name, last_name, email, password_hash,
      role, status, department, job_title, phone, is_profile_complete, is_permanent_admin,
      last_login_at, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [
      user.id,
      user.organizationId,
      user.employeeNumber,
      user.firstName,
      user.lastName,
      user.email.toLowerCase(),
      user.password || null,
      toDbRole(user.role),
      (user.status || "ACTIVE").toString().toUpperCase(),
      user.department || null,
      user.jobTitle || null,
      user.phone || null,
      user.isProfileComplete !== false,
      user.isPermanentAdmin === true,
      user.lastLoginAt || null,
      user.createdAt,
      user.updatedAt || user.createdAt,
    ],
  );
  return (await getUserById(user.id))!;
}

export async function updateUser(id: string, patch: Partial<User>): Promise<User | null> {
  const existing = await getUserById(id);
  if (!existing) return null;
  const merged = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await query(
    `UPDATE users SET
      first_name = $2, last_name = $3, email = $4,
      password_hash = COALESCE($5, password_hash),
      role = $6, status = $7, department = $8, job_title = $9, phone = $10,
      is_profile_complete = $11, last_login_at = $12, updated_at = $13
    WHERE id = $1`,
    [
      id,
      merged.firstName,
      merged.lastName,
      merged.email.toLowerCase(),
      patch.password !== undefined ? patch.password : null,
      toDbRole(merged.role),
      (merged.status || "ACTIVE").toString().toUpperCase(),
      merged.department || null,
      merged.jobTitle || null,
      merged.phone || null,
      merged.isProfileComplete !== false,
      merged.lastLoginAt || null,
      merged.updatedAt,
    ],
  );
  return getUserById(id);
}

export async function deleteUser(id: string): Promise<User | null> {
  const user = await getUserById(id);
  if (!user) return null;
  await query("DELETE FROM users WHERE id = $1", [id]);
  return user;
}

// --- Teams ---

export async function listTeams(orgId: string): Promise<TeamRecord[]> {
  const { rows } = await query(
    "SELECT * FROM teams WHERE organization_id = $1 ORDER BY created_at ASC",
    [orgId],
  );
  return rows.map((r) => ({
    id: String(r.id),
    organizationId: String(r.organization_id),
    name: String(r.name),
    description: r.description ? String(r.description) : "",
    createdBy: r.created_by ? String(r.created_by) : "",
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  }));
}

export async function getTeamById(id: string): Promise<TeamRecord | null> {
  const { rows } = await query("SELECT * FROM teams WHERE id = $1", [id]);
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    id: String(r.id),
    organizationId: String(r.organization_id),
    name: String(r.name),
    description: r.description ? String(r.description) : "",
    createdBy: r.created_by ? String(r.created_by) : "",
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function createTeam(team: TeamRecord, memberIds: string[] = []): Promise<TeamRecord> {
  await query(
    `INSERT INTO teams (id, organization_id, name, description, created_by, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      team.id,
      team.organizationId,
      team.name,
      team.description || "",
      team.createdBy || null,
      team.createdAt,
      team.updatedAt,
    ],
  );
  if (memberIds.length) await addTeamMembers(team.id, memberIds);
  return team;
}

export async function updateTeam(id: string, patch: { name?: string; description?: string }): Promise<TeamRecord | null> {
  const team = await getTeamById(id);
  if (!team) return null;
  await query(
    `UPDATE teams SET name = COALESCE($2, name), description = COALESCE($3, description),
     updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [id, patch.name, patch.description],
  );
  return getTeamById(id);
}

export async function deleteTeam(id: string): Promise<boolean> {
  await query("DELETE FROM team_members WHERE team_id = $1", [id]);
  const { rowCount } = await query("DELETE FROM teams WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}

export async function listTeamMembers(teamId: string): Promise<TeamMemberRecord[]> {
  const { rows } = await query("SELECT * FROM team_members WHERE team_id = $1", [teamId]);
  return rows.map((r) => ({
    id: String(r.id),
    teamId: String(r.team_id),
    userId: String(r.user_id),
    createdAt: String(r.created_at),
  }));
}

export async function addTeamMembers(teamId: string, userIds: string[]): Promise<void> {
  for (const userId of userIds) {
    const exists = await query(
      "SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2",
      [teamId, userId],
    );
    if (exists.rows.length) continue;
    await query(
      `INSERT INTO team_members (id, team_id, user_id) VALUES ($1, $2, $3)`,
      [`tm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, teamId, userId],
    );
  }
  await query("UPDATE teams SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [teamId]);
}

export async function removeTeamMember(teamId: string, userId: string): Promise<boolean> {
  const { rowCount } = await query(
    "DELETE FROM team_members WHERE team_id = $1 AND user_id = $2",
    [teamId, userId],
  );
  if ((rowCount ?? 0) > 0) {
    await query("UPDATE teams SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [teamId]);
    return true;
  }
  return false;
}

export async function getTeamMembersPopulated(teamId: string) {
  const members = await listTeamMembers(teamId);
  const result = [];
  for (const tm of members) {
    const u = await getUserById(tm.userId);
    result.push({
      id: tm.id,
      teamId: tm.teamId,
      userId: tm.userId,
      createdAt: tm.createdAt,
      user: u
        ? {
            id: u.id,
            name: u.name,
            email: u.email,
            department: u.department,
            jobTitle: u.jobTitle,
            role: u.role,
          }
        : undefined,
    });
  }
  return result;
}

// --- Verification codes ---

export async function setVerificationCode(
  email: string,
  purpose: VerificationPurpose,
  code: string,
  expiresAt: Date,
): Promise<void> {
  await query(
    `INSERT INTO verification_codes (email, purpose, code, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email, purpose) DO UPDATE SET code = $3, expires_at = $4, created_at = CURRENT_TIMESTAMP`,
    [email.trim().toLowerCase(), purpose, code, expiresAt.toISOString()],
  );
}

export async function getVerificationCode(email: string, purpose: VerificationPurpose) {
  const { rows } = await query(
    "SELECT code, expires_at FROM verification_codes WHERE email = $1 AND purpose = $2",
    [email.trim().toLowerCase(), purpose],
  );
  if (!rows[0]) return null;
  return {
    code: String(rows[0].code),
    expiresAt: new Date(String(rows[0].expires_at)).getTime(),
  };
}

export async function deleteVerificationCode(email: string, purpose: VerificationPurpose): Promise<void> {
  await query("DELETE FROM verification_codes WHERE email = $1 AND purpose = $2", [
    email.trim().toLowerCase(),
    purpose,
  ]);
}

// --- Stats ---

type MeetingGoalCategory = "planning" | "client" | "team";

const MONTHLY_GOAL_LABELS: Record<MeetingGoalCategory, string> = {
  planning: "جلسات برنامه‌ریزی",
  client: "جلسات با مشتری",
  team: "جلسات تیمی",
};

const MONTHLY_GOAL_TARGETS: Record<MeetingGoalCategory, number> = {
  planning: 8,
  client: 4,
  team: 8,
};

function meetingGoalCategory(title: string): MeetingGoalCategory {
  if (/مشتری|کارفرما|فروش|قرارداد|vip/i.test(title)) return "client";
  if (/تیم|اسپرینت|محصول|هماهنگی|مارکتینگ|استنداپ|داخلی/i.test(title)) return "team";
  return "planning";
}

function isBookingCompleted(
  b: Booking,
  todayStr: string,
  currentHourStr: string,
): boolean {
  if (b.status === "completed") return true;
  if (b.status === "cancelled") return false;
  if (b.date < todayStr) return true;
  if (b.date === todayStr && b.endTime <= currentHourStr) return true;
  return false;
}

function isoDateParts(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type StatsRange = "week" | "month" | "quarter";

function filterBookingsForRange(bookings: Booking[], range: StatsRange): Booking[] {
  const end = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === "week") {
    start.setDate(start.getDate() - 6);
  } else if (range === "month") {
    start.setDate(1);
  } else {
    start.setDate(start.getDate() - 89);
  }
  const startIso = isoDateParts(start);
  const endIso = isoDateParts(end);
  return bookings.filter((b) => b.date >= startIso && b.date <= endIso);
}

function buildQuarterlyUsageBuckets(
  bookings: Booking[],
  todayStr: string,
  currentHourStr: string,
) {
  const buckets: { day: string; date: string; match: (b: Booking) => boolean }[] = [];
  for (let w = 12; w >= 0; w--) {
    const start = new Date();
    start.setDate(start.getDate() - w * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const startIso = isoDateParts(start);
    const endIso = isoDateParts(end);
    buckets.push({
      day: `هفته ${13 - w}`,
      date: startIso,
      match: (b) => b.date >= startIso && b.date <= endIso,
    });
  }
  return buildUsageBuckets(bookings, buckets, todayStr, currentHourStr);
}

function buildUsageBuckets(
  bookings: Booking[],
  buckets: { day: string; date: string; match: (b: Booking) => boolean }[],
  todayStr: string,
  currentHourStr: string,
) {
  const counts = buckets.map((bucket) => {
    const dayBookings = bookings.filter(bucket.match);
    const completedCount = dayBookings.filter((b) =>
      isBookingCompleted(b, todayStr, currentHourStr),
    ).length;
    return { ...bucket, count: dayBookings.length, completedCount };
  });
  const maxCount = Math.max(1, ...counts.map((c) => c.count));
  return counts.map((c) => ({
    day: c.day,
    date: c.date,
    count: c.count,
    completedCount: c.completedCount,
    percentage: Math.round((c.count / maxCount) * 100),
    completedPercentage: Math.round((c.completedCount / maxCount) * 100),
  }));
}

function buildMonthlyGoals(monthBookings: Booking[]) {
  const counts: Record<MeetingGoalCategory, number> = {
    planning: 0,
    client: 0,
    team: 0,
  };
  monthBookings.forEach((b) => {
    counts[meetingGoalCategory(b.title)] += 1;
  });
  return (["planning", "client", "team"] as MeetingGoalCategory[]).map((key) => {
    const count = counts[key];
    const target = MONTHLY_GOAL_TARGETS[key];
    return {
      label: MONTHLY_GOAL_LABELS[key],
      count,
      target,
      pct: Math.min(100, Math.round((count / target) * 100)),
    };
  });
}

export async function getStatsData(options?: {
  orgId?: string;
  forUser?: { id?: string; email?: string };
  range?: StatsRange;
}) {
  const orgId = options?.orgId;
  const rooms = await listRooms(orgId ? { orgId } : {});
  const bookings = await listBookings({
    orgId,
    forUser: options?.forUser,
  });
  const orgBookings = bookings.filter((b) => b.status !== "cancelled");
  const analyticsBookings = options?.range
    ? filterBookingsForRange(orgBookings, options.range)
    : orgBookings;
  const orgUsers = orgId ? await listUsers({ orgId }) : [];
  const deptByUserId = new Map(orgUsers.map((u) => [u.id, u.department || "عمومی"]));
  const deptByEmail = new Map(
    orgUsers
      .filter((u) => u.email)
      .map((u) => [u.email.trim().toLowerCase(), u.department || "عمومی"]),
  );
  const todayStr = formatGregorianIsoLocal();
  const todayBookings = orgBookings.filter((b) => b.date === todayStr);
  const now = new Date();
  const currentHourStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const activeNow = todayBookings.filter(
    (b) => b.startTime <= currentHourStr && b.endTime >= currentHourStr,
  );
  const pendingApprovals = orgBookings.filter((b) => b.status === "pending_approval").length;
  const roomBookingCounts: Record<string, number> = {};
  analyticsBookings.forEach((b) => {
    const roomName = b.roomName?.trim() || "اتاق نامشخص";
    roomBookingCounts[roomName] = (roomBookingCounts[roomName] || 0) + 1;
  });
  const popularRooms = Object.entries(roomBookingCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const departmentCounts: Record<string, number> = {};
  analyticsBookings.forEach((b) => {
    let dept = (b.department || "").trim() || "عمومی";
    if (dept === "عمومی" && b.organizerId) {
      dept = deptByUserId.get(b.organizerId) || dept;
    }
    if (dept === "عمومی" && b.organizerEmail?.trim()) {
      dept = deptByEmail.get(b.organizerEmail.trim().toLowerCase()) || dept;
    }
    departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
  });
  const dayNames = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه"];

  const weeklyBuckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = isoDateParts(d);
    return {
      day: dayNames[d.getDay()],
      date: iso,
      match: (b: Booking) => b.date === iso,
    };
  });
  const weeklyUsage = buildUsageBuckets(
    options?.range === "week" ? analyticsBookings : orgBookings,
    weeklyBuckets,
    todayStr,
    currentHourStr,
  );

  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthBookings = orgBookings.filter((b) => b.date.startsWith(monthPrefix));

  const monthlyBuckets: { day: string; date: string; match: (b: Booking) => boolean }[] = [];
  for (let start = 1; start <= lastDay; start += 7) {
    const end = Math.min(start + 6, lastDay);
    const startIso = `${monthPrefix}-${String(start).padStart(2, "0")}`;
    const endIso = `${monthPrefix}-${String(end).padStart(2, "0")}`;
    monthlyBuckets.push({
      day: `هفته ${monthlyBuckets.length + 1}`,
      date: startIso,
      match: (b) => b.date >= startIso && b.date <= endIso,
    });
  }
  const monthlyUsage = buildUsageBuckets(
    options?.range === "month" ? analyticsBookings : orgBookings,
    monthlyBuckets,
    todayStr,
    currentHourStr,
  );
  const quarterlyUsage =
    options?.range === "quarter"
      ? buildQuarterlyUsageBuckets(analyticsBookings, todayStr, currentHourStr)
      : undefined;
  const monthlyGoals = buildMonthlyGoals(monthBookings);

  let totalMinutes = 0;
  let countedBookings = 0;
  analyticsBookings.forEach((b) => {
    const [sh, sm] = b.startTime.split(":").map(Number);
    const [eh, em] = b.endTime.split(":").map(Number);
    if (!isNaN(sh) && !isNaN(eh)) {
      const diff = eh * 60 + em - (sh * 60 + sm);
      if (diff > 0) {
        totalMinutes += diff;
        countedBookings++;
      }
    }
  });
  const avgMeetingDurationMinutes =
    countedBookings > 0 ? Math.round(totalMinutes / countedBookings) : 0;

  const personalScope = Boolean(options?.forUser);
  const daysInMonth = lastDay;
  const capacitySlots = Math.max(1, rooms.length * daysInMonth);
  const utilizationDenominator = personalScope
    ? Math.max(1, 16)
    : capacitySlots;
  const utilizationNumerator = personalScope ? analyticsBookings.length : monthBookings.length;
  const utilizationRate = Math.min(
    100,
    Math.round((utilizationNumerator / utilizationDenominator) * 100),
  );

  const topRoomObj = popularRooms[0] || { name: rooms[0]?.name || "—", count: 0 };
  const topRoomShare =
    analyticsBookings.length > 0
      ? Math.round((topRoomObj.count / analyticsBookings.length) * 100)
      : 0;
  return {
    totalRooms: rooms.length,
    availableRoomsNow: Math.max(0, rooms.length - activeNow.length),
    activeMeetingsNow: activeNow.length,
    todayBookingsCount: todayBookings.length,
    pendingApprovals,
    totalHistoricalBookings: orgBookings.length,
    thisMonthBookingsCount: monthBookings.length,
    popularRooms,
    departmentStats: departmentCounts,
    utilizationRate,
    weeklyUsage,
    monthlyUsage,
    quarterlyUsage,
    monthlyGoals,
    avgMeetingDurationMinutes,
    periodBookingsCount: options?.range ? analyticsBookings.length : undefined,
    topRoom: {
      name: topRoomObj.name,
      occupancyRate: topRoomShare,
      bookingsCount: topRoomObj.count,
    },
  };
}
