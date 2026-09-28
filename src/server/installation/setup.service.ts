import { randomUUID } from "crypto";
import net from "net";
import type { Request } from "express";
import type { Organization, User } from "../types";
import * as store from "../persistence/store";
import { hashPassword } from "../auth/password.service";
import { upsertOrganizationAuthSettings } from "../auth/auth-settings.store";
import type { GoogleConfiguration, LdapConfiguration } from "../auth/types";
import { issueSessionForUser } from "../auth/session.service";
import { writeAuthAudit } from "../auth/audit.service";
import { testLdapConnection } from "../auth/providers/ldap.provider";
import { linkIdentity } from "../auth/identity.store";
import { markInstallationComplete, markInstallationProgress } from "./installation.store";
import { upsertIntegration } from "./integrations.store";

export type SetupOrganizationInput = {
  name: string;
  code: string;
  contactEmail: string;
  domain: string;
  timezone?: string;
  country?: string;
  logo?: string;
};

export type SetupAdminInput = {
  fullName: string;
  email: string;
  username: string;
  password: string;
};

export type SetupAuthInput = {
  localEnabled: boolean;
  selfRegistrationEnabled: boolean;
  ldapEnabled: boolean;
  ldap?: LdapConfiguration;
  googleEnabled: boolean;
  google?: GoogleConfiguration;
};

export type SetupSmtpInput = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  fromEmail: string;
  fromName?: string;
};

export type SetupStorageInput = {
  type: "local";
  uploadPath: string;
};

export type SetupCompletePayload = {
  organization: SetupOrganizationInput;
  admin: SetupAdminInput;
  auth: SetupAuthInput;
  smtp?: SetupSmtpInput;
  storage: SetupStorageInput;
};

function slugify(code: string): string {
  return code
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function writeSetupAudit(req: Request, action: string, success: boolean, meta?: Record<string, unknown>) {
  await writeAuthAudit({
    req,
    provider: "local",
    action: "login",
    success,
    metadata: { setup: true, setupAction: action, ...meta },
  });
}

export async function testGoogleConfiguration(
  google: GoogleConfiguration,
): Promise<{ ok: boolean; message: string }> {
  if (!google.clientId?.trim()) {
    return { ok: false, message: "Client ID الزامی است." };
  }
  if (!google.clientSecret?.trim()) {
    return { ok: false, message: "Client Secret الزامی است." };
  }
  if (!google.redirectUri?.trim()) {
    return { ok: false, message: "Redirect URL الزامی است." };
  }
  try {
    const u = new URL(google.redirectUri);
    if (!u.protocol.startsWith("http")) {
      return { ok: false, message: "Redirect URL باید با http یا https باشد." };
    }
  } catch {
    return { ok: false, message: "Redirect URL نامعتبر است." };
  }
  return { ok: true, message: "پیکربندی Google OAuth معتبر است." };
}

export async function testSmtpConfiguration(
  smtp: SetupSmtpInput,
): Promise<{ ok: boolean; message: string }> {
  if (!smtp.host?.trim() || !smtp.port) {
    return { ok: false, message: "Host و Port SMTP الزامی است." };
  }
  const port = Number(smtp.port);
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: smtp.host, port, timeout: 8000 }, () => {
      socket.end();
      resolve({
        ok: true,
        message: "اتصال به سرور SMTP برقرار شد (ارسال واقعی ایمیل در پنل اعلان‌ها پیکربندی می‌شود).",
      });
    });
    socket.on("error", (err) => {
      resolve({ ok: false, message: err.message || "اتصال SMTP ناموفق بود." });
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ ok: false, message: "زمان اتصال SMTP به پایان رسید." });
    });
  });
}

export async function completeInstallation(
  req: Request,
  payload: SetupCompletePayload,
): Promise<{ organization: Organization; session: Awaited<ReturnType<typeof issueSessionForUser>> }> {
  const orgCode = payload.organization.code.trim().toUpperCase();
  if (await store.organizationCodeExists(orgCode)) {
    throw Object.assign(new Error("کد سازمان قبلاً ثبت شده است"), { statusCode: 409 });
  }
  if (await store.emailExists(payload.admin.email)) {
    throw Object.assign(new Error("این ایمیل قبلاً ثبت شده است"), { statusCode: 409 });
  }

  const orgId = `org-${randomUUID().slice(0, 8)}`;
  const slug = slugify(payload.organization.code) || orgId;
  const now = new Date().toISOString();

  const org: Organization = {
    id: orgId,
    name: payload.organization.name.trim(),
    code: orgCode,
    domain: payload.organization.domain.trim(),
    status: "ACTIVE",
    slug,
    logo: payload.organization.logo || "🏢",
    primaryColor: "#0f786e",
    plan: "enterprise",
    contactEmail: payload.organization.contactEmail.trim().toLowerCase(),
    buildings: ["ساختمان اصلی"],
    departments: ["عمومی"],
    workHours: { start: "08:00", end: "19:00" },
    settings: {
      autoApprove: true,
      maxBookingHours: 4,
      allowWeekend: false,
      ...( {
        timezone: payload.organization.timezone || "Asia/Tehran",
        country: payload.organization.country || "IR",
      } as Record<string, unknown> ),
    } as Organization["settings"],
    createdAt: now,
    updatedAt: now,
  };

  const createdOrg = await store.createOrganization(org, []);
  await markInstallationProgress({ organizationCreated: true });
  await writeSetupAudit(req, "organization_created", true, { organizationId: orgId });

  const nameParts = payload.admin.fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || "مدیر";
  const lastName = nameParts.slice(1).join(" ") || "سیستم";
  const passwordHash = await hashPassword(payload.admin.password);

  const adminUser: User = {
    id: `user-${randomUUID().slice(0, 8)}`,
    organizationId: orgId,
    employeeNumber: payload.admin.username.trim(),
    firstName,
    lastName,
    name: payload.admin.fullName.trim(),
    email: payload.admin.email.trim().toLowerCase(),
    password: passwordHash,
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    department: "مدیریت",
    jobTitle: "مدیر نصب",
    isPermanentAdmin: true,
    isProfileComplete: true,
    createdAt: now,
    updatedAt: now,
  };

  const user = await store.insertUser(adminUser);
  await linkIdentity({
    userId: user.id,
    organizationId: orgId,
    provider: "local",
    providerUserId: user.email,
    providerEmail: user.email,
    metadata: { source: "setup_wizard" },
  });
  await markInstallationProgress({ adminCreated: true });
  await writeSetupAudit(req, "admin_created", true, { userId: user.id, organizationId: orgId });

  if (payload.auth.ldapEnabled && payload.auth.ldap) {
    const ldapTest = await testLdapConnection(payload.auth.ldap);
    if (!ldapTest.ok) {
      throw Object.assign(new Error(ldapTest.message), { statusCode: 400 });
    }
  }
  if (payload.auth.googleEnabled && payload.auth.google) {
    const googleTest = await testGoogleConfiguration(payload.auth.google);
    if (!googleTest.ok) {
      throw Object.assign(new Error(googleTest.message), { statusCode: 400 });
    }
  }

  await upsertOrganizationAuthSettings(orgId, {
    localEnabled: payload.auth.localEnabled,
    ldapEnabled: payload.auth.ldapEnabled,
    googleEnabled: payload.auth.googleEnabled,
    ldapConfiguration: payload.auth.ldap || {},
    googleConfiguration: payload.auth.google || {},
    authPolicies: {
      selfRegistrationEnabled: payload.auth.selfRegistrationEnabled,
      emailVerificationRequired: false,
      defaultLocalRole: "EMPLOYEE",
    },
  });

  if (payload.smtp?.host) {
    await upsertIntegration(orgId, "smtp", {
      host: payload.smtp.host,
      port: payload.smtp.port,
      username: payload.smtp.username || "",
      password: payload.smtp.password || "",
      fromEmail: payload.smtp.fromEmail,
      fromName: payload.smtp.fromName || payload.organization.name,
    });
  }

  await upsertIntegration(orgId, "storage", {
    type: payload.storage.type,
    uploadPath: payload.storage.uploadPath || process.env.UPLOAD_PATH || "./uploads",
  });

  await markInstallationComplete();
  await writeSetupAudit(req, "installation_complete", true, { organizationId: orgId });

  const session = await issueSessionForUser(user, "نصب اولیه با موفقیت انجام شد. خوش آمدید.");
  return { organization: createdOrg, session };
}
