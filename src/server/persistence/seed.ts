import { query } from "./db";
import { runSqlFile } from "./sql-runner";
import { ensureBaseSchema, ensureServerSchema, insertUser, usersTableExists } from "./store";
import { isInstallationInitialized } from "../installation/installation.store";
import type { User } from "../types";
import { hashPassword } from "../auth/password.service";

export const DEFAULT_DEMO_PASSWORD = "password123";

const DEMO_USERS: User[] = [
  {
    id: "user-super",
    organizationId: "org-1",
    employeeNumber: "RC-001",
    firstName: "مدیر ارشد",
    lastName: "روم‌چی",
    email: "admin@rooomchi.ir",
    password: DEFAULT_DEMO_PASSWORD,
    status: "ACTIVE",
    role: "SUPER_ADMIN",
    department: "مدیریت کل سیستم",
    jobTitle: "مدیر ارشد پلتفرم",
    phone: "09120000001",
    isPermanentAdmin: true,
    isProfileComplete: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-super-2",
    organizationId: "org-1",
    employeeNumber: "RC-002",
    firstName: "مدیر فنی",
    lastName: "روم‌چی",
    email: "root@rooomchi.ir",
    password: DEFAULT_DEMO_PASSWORD,
    status: "ACTIVE",
    role: "SUPER_ADMIN",
    department: "امنیت و زیرساخت",
    jobTitle: "مدیر ارشد فنی و امنیت",
    phone: "09120000002",
    isPermanentAdmin: true,
    isProfileComplete: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-org-admin",
    organizationId: "org-1",
    employeeNumber: "TECH-101",
    firstName: "علیرضا",
    lastName: "راد",
    email: "admin@technova.ir",
    password: DEFAULT_DEMO_PASSWORD,
    status: "ACTIVE",
    role: "ORGANIZATION_ADMIN",
    department: "تیم فنی و مهندسی",
    jobTitle: "معاون فناوری و زیرساخت",
    phone: "09121112233",
    isProfileComplete: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-facility",
    organizationId: "org-1",
    employeeNumber: "TECH-202",
    firstName: "مریم",
    lastName: "کمالی",
    email: "facility@technova.ir",
    password: DEFAULT_DEMO_PASSWORD,
    status: "ACTIVE",
    role: "MANAGER",
    department: "امور اداری و تشریفات",
    jobTitle: "سرپرست خدمات و جلسات",
    phone: "09123334455",
    isProfileComplete: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-employee",
    organizationId: "org-1",
    employeeNumber: "TECH-303",
    firstName: "علی",
    lastName: "احمدی",
    email: "employee@technova.ir",
    password: DEFAULT_DEMO_PASSWORD,
    status: "ACTIVE",
    role: "EMPLOYEE",
    department: "مارکتینگ و رشد",
    jobTitle: "کارشناس ارشد دیجیتال مارکتینگ",
    phone: "09127778899",
    isProfileComplete: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-tech-reza",
    organizationId: "org-1",
    employeeNumber: "TECH-304",
    firstName: "رضا",
    lastName: "صادقی",
    email: "reza.sadeghi@technova.ir",
    password: DEFAULT_DEMO_PASSWORD,
    status: "ACTIVE",
    role: "EMPLOYEE",
    department: "محصول و طراحی",
    jobTitle: "طراح ارشد محصول",
    phone: "09124445566",
    isProfileComplete: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-taban-admin",
    organizationId: "org-2",
    employeeNumber: "TABAN-01",
    firstName: "کامران",
    lastName: "حیدری",
    email: "admin@taban.group",
    password: DEFAULT_DEMO_PASSWORD,
    status: "ACTIVE",
    role: "ORGANIZATION_ADMIN",
    department: "سرمایه‌گذاری خطرپذیر",
    jobTitle: "معاون سرمایه‌گذاری",
    phone: "09129990011",
    isProfileComplete: true,
    createdAt: new Date().toISOString(),
  },
];

export type SyncDatabaseOptions = {
  /** Apply schema/02-server-extensions.sql */
  schema?: boolean;
  /** Run schema/idempotent-seed.sql (orgs, rooms, SQL users, teams, sample booking) */
  reference?: boolean;
  /** Insert Express demo users (admin@rooomchi.ir, …) */
  demoUsers?: boolean;
  /** Insert demo users even when user-super already exists */
  forceDemoUsers?: boolean;
};

export async function seedReferenceData(): Promise<void> {
  const count = await runSqlFile("schema/idempotent-seed.sql");
  console.log(`✅ Reference seed SQL applied (${count} statement(s)).`);
}

export function isDemoLoginSyncEnabled(): boolean {
  return (
    process.env.ROOOMCHI_DEMO_MODE === "true" ||
    process.env.NODE_ENV !== "production"
  );
}

/** Ensures DB users can sign in for demos (password: password123). */
export async function ensureDemoLoginPasswords(): Promise<void> {
  if (!isDemoLoginSyncEnabled()) return;
  if (!(await usersTableExists())) return;

  const hashed = await hashPassword(DEFAULT_DEMO_PASSWORD);
  const demoEmails = DEMO_USERS.map((u) => u.email.toLowerCase());

  for (const email of demoEmails) {
    await query(
      `UPDATE users SET password_hash = $1, updated_at = NOW()
       WHERE LOWER(email) = $2`,
      [hashed, email],
    );
  }

  const { rowCount } = await query(
    `UPDATE users SET password_hash = $1, updated_at = NOW()
     WHERE password_hash IS NULL OR password_hash = '' OR password_hash = $2`,
    [hashed, DEFAULT_DEMO_PASSWORD],
  );

  if ((rowCount ?? 0) > 0 || demoEmails.length > 0) {
    console.log(
      `✅ Demo login passwords synced (${DEFAULT_DEMO_PASSWORD} — bcrypt). SQL users without hash included.`,
    );
  }
}

export async function seedDevUsers(options?: { force?: boolean }): Promise<void> {
  const skipInsert =
    !options?.force &&
    Number(
      (
        await query<{ c: string }>(
          "SELECT COUNT(*)::text AS c FROM users WHERE id = 'user-super'",
        )
      ).rows[0]?.c,
    ) > 0;

  if (skipInsert) {
    console.log("ℹ️  Demo users already present (user-super). Syncing demo passwords…");
    await ensureDemoLoginPasswords();
    return;
  }

  const hashedDefault = await hashPassword(DEFAULT_DEMO_PASSWORD);
  let inserted = 0;
  for (const u of DEMO_USERS) {
    try {
      await insertUser({ ...u, password: hashedDefault });
      inserted += 1;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes("duplicate") && !message.includes("unique")) {
        console.warn("[seed] skip user", u.email, message);
      }
    }
  }

  console.log(
    `✅ Demo users seed finished (${inserted} new, password: ${DEFAULT_DEMO_PASSWORD} for new accounts).`,
  );
  await ensureDemoLoginPasswords();
}

/** Ensures demo accounts from the legacy in-memory server exist in PostgreSQL. */
export async function seedDevDataIfNeeded(): Promise<void> {
  try {
    if (!(await isInstallationInitialized())) {
      console.log("ℹ️  Fresh installation — skipping demo seed until setup wizard completes.");
      return;
    }
  } catch {
    /* installation_status table may not exist yet */
  }
  await seedDevUsers();
  await ensureDemoLoginPasswords();
}

export async function syncDatabase(options: SyncDatabaseOptions = {}): Promise<void> {
  const schema = options.schema !== false;
  const reference = options.reference !== false;
  const demoUsers = options.demoUsers !== false;

  if (schema) {
    await ensureBaseSchema();
    await ensureServerSchema();
    console.log("✅ Server schema extensions applied.");
  }
  if (reference) {
    await seedReferenceData();
  }
  if (demoUsers) {
    await seedDevUsers({ force: options.forceDemoUsers });
  }
}

export async function printDatabaseCounts(): Promise<void> {
  const tables = ["organizations", "rooms", "users", "bookings", "teams"] as const;
  for (const table of tables) {
    try {
      const { rows } = await query<{ c: string }>(`SELECT COUNT(*)::text AS c FROM ${table}`);
      console.log(`   ${table}: ${rows[0]?.c ?? "?"}`);
    } catch {
      console.log(`   ${table}: (table missing)`);
    }
  }
}
