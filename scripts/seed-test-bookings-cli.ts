#!/usr/bin/env tsx
/**
 * Insert sample bookings for UI/testing (e.g. dashboard "last 10" table).
 *
 * Usage:
 *   npm run seed:test-bookings
 *   npm run seed:test-bookings -- --count 20 --org demis
 */
import "dotenv/config";
import { getDbPool } from "../src/services/dbService";
import {
  createBooking,
  findOrganizationBySlugOrCode,
  listOrganizations,
  listRooms,
} from "../src/server/persistence/store";
import type { Booking } from "../src/server/types";
import { formatGregorianIsoLocal } from "../src/utils/jalali";

function parseArg(name: string, fallback: string): string {
  const i = process.argv.indexOf(name);
  if (i === -1 || !process.argv[i + 1]) return fallback;
  return process.argv[i + 1];
}

function parseCount(): number {
  const raw = parseArg("--count", "20");
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > 200) {
    console.error("Invalid --count (use 1–200)");
    process.exit(1);
  }
  return Math.floor(n);
}

function addDays(base: Date, delta: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

const ORGANIZER_POOL = [
  { name: "مدیر سازمان", email: "admin@technova.ir" },
  { name: "سارا احمدی", email: "employee@technova.ir" },
  { name: "مریم کمالی", email: "facility@technova.ir" },
  { name: "علیرضا راد", email: "admin@technova.ir" },
];

async function resolveOrgId(): Promise<{ id: string; name: string }> {
  const orgKey = parseArg("--org", "");
  const orgIdFlag = parseArg("--org-id", "");

  if (orgIdFlag) {
    const orgs = await listOrganizations();
    const hit = orgs.find((o) => o.id === orgIdFlag);
    if (!hit) {
      console.error(`Organization id not found: ${orgIdFlag}`);
      process.exit(1);
    }
    return { id: hit.id, name: hit.name };
  }

  if (orgKey) {
    const org = await findOrganizationBySlugOrCode(orgKey);
    if (!org) {
      console.error(`Organization not found for slug/code: ${orgKey}`);
      process.exit(1);
    }
    return { id: org.id, name: org.name };
  }

  const orgs = await listOrganizations();
  if (!orgs.length) {
    console.error("No organizations in database.");
    process.exit(1);
  }
  return { id: orgs[0].id, name: orgs[0].name };
}

async function main(): Promise<void> {
  const pool = getDbPool();
  if (!pool) {
    console.error("PostgreSQL is not configured (DATABASE_URL).");
    process.exit(1);
  }
  await pool.query("SELECT 1");

  const count = parseCount();
  const org = await resolveOrgId();
  const rooms = await listRooms({ orgId: org.id, status: "available" });
  const activeRooms = rooms.filter((r) => r.status !== "maintenance");
  if (!activeRooms.length) {
    console.error(`No rooms for organization ${org.name} (${org.id}).`);
    process.exit(1);
  }

  const today = new Date();
  const batch = `test-${Date.now()}`;
  let created = 0;

  for (let i = 0; i < count; i++) {
    const room = activeRooms[i % activeRooms.length];
    const dayOffset = -(i % 12);
    const date = formatGregorianIsoLocal(addDays(today, dayOffset));
    const startHour = 8 + (i % 9);
    const startTime = `${pad2(startHour)}:${pad2((i * 7) % 60)}`;
    const endHour = Math.min(startHour + 1 + (i % 2), 20);
    const endTime = `${pad2(endHour)}:${pad2((i * 11) % 60)}`;
    const organizer = ORGANIZER_POOL[i % ORGANIZER_POOL.length];

    const booking: Booking = {
      id: `book-${batch}-${i}`,
      orgId: org.id,
      roomId: room.id,
      roomName: room.name,
      title: `جلسه تست ${i + 1}`,
      description: "رزرو نمونه برای تست داشبورد",
      organizerName: organizer.name,
      organizerEmail: organizer.email,
      department: "عمومی",
      date,
      startTime,
      endTime,
      attendeesCount: 4 + (i % 8),
      attendeeEmails: [],
      equipmentNeeded: [],
      cateringNeeded: i % 5 === 0,
      status: i % 7 === 0 ? "pending_approval" : "confirmed",
      createdAt: addDays(today, dayOffset - (i % 3)).toISOString(),
    };

    await createBooking(booking);
    created += 1;
  }

  console.log(`✅ Created ${created} test bookings for «${org.name}» (${org.id}).`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
