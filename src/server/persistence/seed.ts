import { query } from "./db";
import { insertUser } from "./store";
import type { User } from "../types";

const DEFAULT_PASSWORD = "password123";

/** Ensures demo accounts from the legacy in-memory server exist in PostgreSQL. */
export async function seedDevDataIfNeeded(): Promise<void> {
  const { rows } = await query<{ c: string }>("SELECT COUNT(*)::text AS c FROM users WHERE id = 'user-super'");
  if (Number(rows[0]?.c) > 0) return;

  const demoUsers: User[] = [
    {
      id: "user-super",
      organizationId: "org-1",
      employeeNumber: "RC-001",
      firstName: "مدیر ارشد",
      lastName: "روم‌چی",
      email: "admin@rooomchi.ir",
      password: DEFAULT_PASSWORD,
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
      password: DEFAULT_PASSWORD,
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
      password: DEFAULT_PASSWORD,
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
      password: DEFAULT_PASSWORD,
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
      password: DEFAULT_PASSWORD,
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
      password: DEFAULT_PASSWORD,
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
      password: DEFAULT_PASSWORD,
      status: "ACTIVE",
      role: "ORGANIZATION_ADMIN",
      department: "سرمایه‌گذاری خطرپذیر",
      jobTitle: "معاون سرمایه‌گذاری",
      phone: "09129990011",
      isProfileComplete: true,
      createdAt: new Date().toISOString(),
    },
  ];

  for (const u of demoUsers) {
    try {
      await insertUser(u);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes("duplicate") && !message.includes("unique")) {
        console.warn("[seed] skip user", u.email, message);
      }
    }
  }

  console.log("✅ Demo users seeded into PostgreSQL (password: password123 for new accounts).");
}
