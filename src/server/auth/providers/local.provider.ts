import type { Request } from "express";
import type { Organization } from "../../types";
import * as store from "../../persistence/store";
import { verifyPassword, normalizePasswordForStorage } from "../password.service";
import { writeAuthAudit } from "../audit.service";
import { issueSessionForUser } from "../session.service";
import type { OrganizationAuthSettings } from "../types";
import { linkIdentity } from "../identity.store";
import { DEFAULT_DEMO_PASSWORD, isDemoLoginSyncEnabled } from "../../persistence/seed";

export async function localLogin(params: {
  req: Request;
  organization: Organization | null;
  settings: OrganizationAuthSettings;
  email?: string;
  employeeNumber?: string;
  password: string;
}) {
  const { req, organization, settings, email, employeeNumber, password } = params;

  if (!password) {
    throw Object.assign(new Error("لطفاً رمز عبور را وارد کنید"), { statusCode: 400 });
  }

  if (!settings.localEnabled) {
    await writeAuthAudit({
      req,
      organizationId: organization?.id,
      provider: "local",
      action: "login_failed",
      success: false,
      metadata: { reason: "local_disabled" },
    });
    throw Object.assign(new Error("ورود با ایمیل و رمز عبور برای این سازمان غیرفعال است"), {
      statusCode: 403,
    });
  }

  let user = undefined;
  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    user = (await store.findUserByEmail(normalizedEmail)) ?? undefined;
    if (!user) {
      await writeAuthAudit({
        req,
        organizationId: organization?.id,
        provider: "local",
        action: "login_failed",
        success: false,
        metadata: { email: normalizedEmail },
      });
      throw Object.assign(
        new Error("کاربری با این ایمیل یافت نشد. لطفاً از بخش ثبت‌نام اقدام به ایجاد حساب کاربری نمایید"),
        { statusCode: 401 },
      );
    }
    if (organization && user.organizationId !== organization.id) {
      await writeAuthAudit({
        req,
        userId: user.id,
        organizationId: organization.id,
        provider: "local",
        action: "login_failed",
        success: false,
      });
      throw Object.assign(
        new Error(`کاربر '${normalizedEmail}' متعلق به فضای سازمانی '${organization.name}' نیست`),
        { statusCode: 401 },
      );
    }
  } else if (employeeNumber && organization) {
    if (organization.status !== "ACTIVE") {
      throw Object.assign(
        new Error(`سازمان '${organization.name}' در وضعیت ${organization.status} قرار دارد`),
        { statusCode: 403 },
      );
    }
    user = (await store.findUserByEmployeeNumber(organization.id, employeeNumber)) ?? undefined;
    if (!user) {
      await writeAuthAudit({
        req,
        organizationId: organization.id,
        provider: "local",
        action: "login_failed",
        success: false,
      });
      throw Object.assign(new Error("شماره پرسنلی یا مشخصات وارد شده برای این سازمان معتبر نیست"), {
        statusCode: 401,
      });
    }
  } else {
    throw Object.assign(new Error("ورود نیازمند ایمیل یا شماره پرسنلی و رمز عبور است"), {
      statusCode: 400,
    });
  }

  let storedPassword = user.password;
  if (!storedPassword && isDemoLoginSyncEnabled()) {
    storedPassword = DEFAULT_DEMO_PASSWORD;
  }
  const ok = await verifyPassword(password, storedPassword);
  if (!ok) {
    await writeAuthAudit({
      req,
      userId: user.id,
      organizationId: user.organizationId,
      provider: "local",
      action: "login_failed",
      success: false,
    });
    throw Object.assign(new Error("رمز عبور وارد شده نادرست است"), { statusCode: 401 });
  }

  if (user.password && !user.password.startsWith("$2")) {
    const hashed = await normalizePasswordForStorage(password);
    await store.updateUser(user.id, { password: hashed });
  }

  await linkIdentity({
    userId: user.id,
    organizationId: user.organizationId,
    provider: "local",
    providerUserId: user.email.toLowerCase(),
    providerEmail: user.email,
  });

  const session = await issueSessionForUser(user);
  await writeAuthAudit({
    req,
    userId: user.id,
    organizationId: user.organizationId,
    provider: "local",
    action: "login",
    success: true,
  });
  return session;
}

export async function localRegister(params: {
  req: Request;
  settings: OrganizationAuthSettings;
  organizationId: string;
  name?: string;
  email: string;
  password: string;
  department?: string;
  jobTitle?: string;
  phone?: string;
}) {
  if (!params.settings.localEnabled) {
    throw Object.assign(new Error("ثبت‌نام محلی برای این سازمان غیرفعال است"), { statusCode: 403 });
  }
  if (params.settings.authPolicies.selfRegistrationEnabled === false) {
    throw Object.assign(new Error("ثبت‌نام خودکار توسط مدیر سازمان غیرفعال شده است"), {
      statusCode: 403,
    });
  }

  const normalizedEmail = params.email.trim().toLowerCase();
  if (await store.emailExists(normalizedEmail)) {
    throw Object.assign(new Error("کاربری با این ایمیل قبلاً ثبت‌نام کرده است"), { statusCode: 409 });
  }

  const org = await store.getOrganizationById(params.organizationId);
  if (!org) throw Object.assign(new Error("سازمان یافت نشد"), { statusCode: 404 });

  const hashed = await normalizePasswordForStorage(params.password);
  const role = params.settings.authPolicies.defaultLocalRole || "EMPLOYEE";
  const trimmedName = params.name?.trim() || "";
  const newUser = await store.insertUser({
    id: `usr-${Date.now()}`,
    organizationId: org.id,
    employeeNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    firstName: trimmedName ? trimmedName.split(" ")[0] : "",
    lastName: trimmedName ? trimmedName.split(" ").slice(1).join(" ") : "",
    name: trimmedName || normalizedEmail.split("@")[0],
    email: normalizedEmail,
    password: hashed,
    status: "ACTIVE",
    role,
    department: params.department?.trim() || org.departments?.[0] || "عمومی",
    jobTitle: params.jobTitle?.trim() || "کارشناس",
    phone: params.phone?.trim() || "",
    isProfileComplete: Boolean(trimmedName && params.phone?.trim()),
    orgName: org.name,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  });

  await linkIdentity({
    userId: newUser.id,
    organizationId: org.id,
    provider: "local",
    providerUserId: normalizedEmail,
    providerEmail: normalizedEmail,
  });

  const session = await issueSessionForUser(newUser, "ثبت‌نام با موفقیت انجام شد");
  await writeAuthAudit({
    req: params.req,
    userId: newUser.id,
    organizationId: org.id,
    provider: "local",
    action: "register",
    success: true,
  });
  return session;
}
