import fs from "fs/promises";
import path from "path";
import { getDbPool } from "../../services/dbService";

export type PreflightCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type SetupPreflightResult = {
  ok: boolean;
  checks: PreflightCheck[];
};

async function checkDatabase(): Promise<PreflightCheck> {
  const pool = getDbPool();
  if (!pool) {
    return {
      id: "database",
      label: "اتصال پایگاه داده",
      ok: false,
      detail: "DATABASE_URL یا متغیرهای DB_* تنظیم نشده است.",
    };
  }
  try {
    await pool.query("SELECT 1");
    return { id: "database", label: "اتصال پایگاه داده", ok: true, detail: "اتصال PostgreSQL موفق بود." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطای اتصال";
    return { id: "database", label: "اتصال پایگاه داده", ok: false, detail: msg };
  }
}

async function checkStorage(): Promise<PreflightCheck> {
  const uploadPath = process.env.UPLOAD_PATH?.trim() || "./uploads";
  const resolved = path.isAbsolute(uploadPath) ? uploadPath : path.join(process.cwd(), uploadPath);
  try {
    await fs.mkdir(resolved, { recursive: true });
    const probe = path.join(resolved, `.write-probe-${Date.now()}`);
    await fs.writeFile(probe, "ok", "utf8");
    await fs.unlink(probe);
    return {
      id: "storage",
      label: "دسترسی ذخیره‌سازی",
      ok: true,
      detail: `مسیر ${resolved} قابل نوشتن است.`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطای دسترسی";
    return { id: "storage", label: "دسترسی ذخیره‌سازی", ok: false, detail: msg };
  }
}

function checkEnvironment(): PreflightCheck {
  const issues: string[] = [];
  const isProd = process.env.NODE_ENV === "production";
  if (!process.env.APP_URL?.trim()) issues.push("APP_URL خالی است");
  if (isProd && !process.env.JWT_SECRET?.trim()) issues.push("JWT_SECRET در production الزامی است");
  if (isProd && (process.env.JWT_SECRET?.length || 0) < 32) {
    issues.push("JWT_SECRET باید حداقل ۳۲ کاراکتر باشد");
  }
  if (issues.length === 0) {
    return { id: "environment", label: "اعتبارسنجی محیط", ok: true, detail: "تنظیمات پایه محیط کافی است." };
  }
  return { id: "environment", label: "اعتبارسنجی محیط", ok: !isProd, detail: issues.join(" · ") };
}

export async function runSetupPreflight(): Promise<SetupPreflightResult> {
  const checks = await Promise.all([checkDatabase(), checkStorage(), Promise.resolve(checkEnvironment())]);
  return { ok: checks.every((c) => c.ok), checks };
}
