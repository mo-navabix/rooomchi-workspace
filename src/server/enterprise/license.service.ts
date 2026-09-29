import fs from "fs";
import path from "path";

export type EnterpriseLicense = {
  organization: string;
  maxUsers: number;
  expireDate: string;
  features: string[];
};

export type LicenseStatus = {
  configured: boolean;
  valid: boolean;
  license: EnterpriseLicense | null;
  message: string;
  daysUntilExpiry: number | null;
};

function resolveLicensePath(): string {
  const fromEnv = process.env.LICENSE_PATH?.trim();
  if (fromEnv) return path.isAbsolute(fromEnv) ? fromEnv : path.join(process.cwd(), fromEnv);
  return path.join(process.cwd(), "config", "license.json");
}

export function loadEnterpriseLicense(): EnterpriseLicense | null {
  const filePath = resolveLicensePath();
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as Partial<EnterpriseLicense>;
    if (!raw.organization || !raw.expireDate) return null;
    return {
      organization: String(raw.organization),
      maxUsers: Number(raw.maxUsers) || 0,
      expireDate: String(raw.expireDate),
      features: Array.isArray(raw.features) ? raw.features.map(String) : [],
    };
  } catch {
    return null;
  }
}

export function evaluateLicenseStatus(): LicenseStatus {
  const license = loadEnterpriseLicense();
  if (!license) {
    return {
      configured: false,
      valid: true,
      license: null,
      message: "فایل license.json تنظیم نشده — در نصب داخلی بدون محدودیت لایسنس اجرا می‌شود.",
      daysUntilExpiry: null,
    };
  }

  const expiry = new Date(license.expireDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const valid = !Number.isNaN(expiry.getTime()) && expiry >= now;

  return {
    configured: true,
    valid,
    license,
    daysUntilExpiry: Number.isNaN(expiry.getTime()) ? null : daysUntilExpiry,
    message: valid
      ? `لایسنس فعال تا ${license.expireDate}`
      : `لایسنس منقضی شده (${license.expireDate})`,
  };
}
