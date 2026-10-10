import type { Express, RequestHandler } from "express";
import { asyncRoute, stripPassword } from "../http";
import { extractJwtUser } from "../authHelpers";
import * as store from "../persistence/store";
import { resolveOrganizationFromRequest } from "./auth-context";
import {
  getOrganizationAuthSettings,
  publicAuthSettingsView,
  upsertOrganizationAuthSettings,
  replaceLdapGroupRoleMappings,
} from "./auth-settings.store";
import type { LdapConfiguration } from "./types";
import { mergeLdapConfiguration } from "./ldap-config.util";
import { localLogin, localRegister } from "./providers/local.provider";
import { ldapLogin } from "./providers/ldap.provider";
import {
  buildOAuthCallbackHtml,
  createGoogleAuthUrl,
  handleGoogleCallback,
} from "./providers/google.provider";
import { verifyPassword, normalizePasswordForStorage } from "./password.service";
import { writeAuthAudit } from "./audit.service";

function bindAuth(path: string, app: Express, handler: RequestHandler) {
  app.post(path, handler);
  if (!path.startsWith("/api")) {
    app.post(`/api${path}`, handler);
  }
}

function bindGet(path: string, app: Express, handler: RequestHandler) {
  app.get(path, handler);
  if (!path.startsWith("/api")) {
    app.get(`/api${path}`, handler);
  }
}

export function registerAuthRoutes(app: Express): void {
  bindGet(
    "/auth/me",
    app,
    asyncRoute(async (req, res) => {
      const caller = extractJwtUser(req);
      if (!caller) return res.status(401).json({ error: "Unauthorized" });
      const user = await store.getUserById(caller.userId);
      if (!user) return res.status(404).json({ error: "کاربر یافت نشد" });
      res.json({ user: stripPassword(user) });
    }),
  );

  bindGet(
    "/organizations/:orgId/auth-settings",
    app,
    asyncRoute(async (req, res) => {
      const org = await store.getOrganizationById(req.params.orgId);
      if (!org) return res.status(404).json({ error: "سازمان یافت نشد" });
      const settings = await getOrganizationAuthSettings(org.id);
      res.json(publicAuthSettingsView(settings));
    }),
  );

  bindGet(
    "/auth/organizations/:slug/settings",
    app,
    asyncRoute(async (req, res) => {
      const org = await store.findOrganizationBySlugOrCode(req.params.slug);
      if (!org) return res.status(404).json({ error: "سازمان یافت نشد" });
      const settings = await getOrganizationAuthSettings(org.id);
      res.json({ organization: { id: org.id, name: org.name, slug: org.slug }, ...publicAuthSettingsView(settings) });
    }),
  );

  app.put(
    "/api/organizations/:orgId/auth-settings",
    asyncRoute(async (req, res) => {
      const caller = extractJwtUser(req);
      if (!caller) return res.status(401).json({ error: "Unauthorized" });
      const role = caller.role.toUpperCase();
      if (!["SUPER_ADMIN", "ORGANIZATION_ADMIN", "ORG_ADMIN"].includes(role)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (role !== "SUPER_ADMIN" && caller.organizationId !== req.params.orgId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const body = req.body as Record<string, unknown>;
      const current = await getOrganizationAuthSettings(req.params.orgId);
      const ldapPatch = (body.ldapConfiguration || {}) as LdapConfiguration;
      const updated = await upsertOrganizationAuthSettings(req.params.orgId, {
        localEnabled: body.localEnabled as boolean | undefined,
        ldapEnabled: body.ldapEnabled as boolean | undefined,
        googleEnabled: body.googleEnabled as boolean | undefined,
        ldapConfiguration: mergeLdapConfiguration(current.ldapConfiguration, ldapPatch),
        googleConfiguration: body.googleConfiguration as Record<string, unknown> | undefined,
        authPolicies: body.authPolicies as Record<string, unknown> | undefined,
      });
      if (Array.isArray(body.ldapGroupRoleMappings)) {
        await replaceLdapGroupRoleMappings(
          req.params.orgId,
          body.ldapGroupRoleMappings as { ldapGroup: string; role: string }[],
        );
      }
      res.json(publicAuthSettingsView(updated));
    }),
  );

  const handleLogin = asyncRoute(async (req, res) => {
    const org = await resolveOrganizationFromRequest(req, req.body);
    const orgId = org?.id || req.body.organizationId;
    const settings = orgId
      ? await getOrganizationAuthSettings(orgId)
      : await getOrganizationAuthSettings((await store.listOrganizations())[0]?.id || "org-1");

    const session = await localLogin({
      req,
      organization: org,
      settings,
      email: req.body.email,
      employeeNumber: req.body.employeeNumber,
      password: req.body.password,
    });
    res.json(session);
  });

  bindAuth("/auth/login", app, handleLogin);
  bindAuth("/auth/local/login", app, handleLogin);

  bindAuth(
    "/auth/ldap/login",
    app,
    asyncRoute(async (req, res) => {
      const { username, password, organizationSlug, organizationId } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "نام کاربری و رمز عبور LDAP الزامی است" });
      }
      const org =
        (organizationId && (await store.getOrganizationById(organizationId))) ||
        (organizationSlug && (await store.findOrganizationBySlugOrCode(organizationSlug))) ||
        (await resolveOrganizationFromRequest(req, req.body));
      if (!org) {
        return res.status(400).json({ error: "سازمان برای ورود LDAP مشخص نیست" });
      }
      const settings = await getOrganizationAuthSettings(org.id);
      const session = await ldapLogin({ req, organization: org, settings, username, password });
      res.json(session);
    }),
  );

  bindGet(
    "/auth/google/start",
    app,
    asyncRoute(async (req, res) => {
      const slug = String(req.query.organizationSlug || req.query.org || "");
      const orgId = req.query.organizationId ? String(req.query.organizationId) : undefined;
      const org =
        (orgId && (await store.getOrganizationById(orgId))) ||
        (slug && (await store.findOrganizationBySlugOrCode(slug))) ||
        null;
      if (!org) return res.status(400).json({ error: "سازمان مشخص نیست" });
      const settings = await getOrganizationAuthSettings(org.id);
      const redirectAfter = req.query.redirectAfter ? String(req.query.redirectAfter) : "/";
      const { url } = await createGoogleAuthUrl({ organization: org, settings, redirectAfter });
      if (req.query.json === "1") return res.json({ url });
      res.redirect(url);
    }),
  );

  bindGet(
    "/auth/google/callback",
    app,
    asyncRoute(async (req, res) => {
      const code = String(req.query.code || "");
      const state = String(req.query.state || "");
      if (!code || !state) return res.status(400).send("Missing code or state");
      const { session, redirectAfter } = await handleGoogleCallback({ req, code, state });
      if (req.query.json === "1") return res.json(session);
      res.type("html").send(buildOAuthCallbackHtml(session.token, redirectAfter, session.user));
    }),
  );

  const handleRegister = asyncRoute(async (req, res) => {
    const { name, email, password, department, jobTitle, phone, orgId, organizationId } = req.body;
    const targetOrgId =
      organizationId ||
      orgId ||
      (await resolveOrganizationFromRequest(req, req.body))?.id ||
      (await store.listOrganizations())[0]?.id;
    if (!targetOrgId) return res.status(400).json({ error: "سازمان مشخص نیست" });
    const settings = await getOrganizationAuthSettings(targetOrgId);
    const session = await localRegister({
      req,
      settings,
      organizationId: targetOrgId,
      name,
      email,
      password,
      department,
      jobTitle,
      phone,
    });
    res.status(201).json(session);
  });

  bindAuth("/auth/register", app, handleRegister);
  bindAuth("/auth/local/register", app, handleRegister);

  const handleChangePassword = asyncRoute(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const caller = extractJwtUser(req);
    if (!caller) {
      return res.status(401).json({ statusCode: 401, error: "Unauthorized", message: "JWT الزامی است" });
    }
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ statusCode: 400, error: "Bad Request", message: "رمز فعلی و جدید الزامی است" });
    }
    const user = await store.getUserById(caller.userId);
    if (!user) return res.status(404).json({ error: "کاربر یافت نشد" });
    const ok = await verifyPassword(currentPassword, user.password);
    if (!ok) return res.status(400).json({ error: "رمز عبور فعلی تطابق ندارد" });
    const hashed = await normalizePasswordForStorage(newPassword.trim());
    await store.updateUser(user.id, { password: hashed, status: "ACTIVE" });
    res.json({ message: "رمز عبور با موفقیت تغییر کرد" });
  });

  bindAuth("/auth/change-password", app, handleChangePassword);

  // --- OTP / forgot / reset (local) — kept for compatibility ---
  bindAuth(
    "/auth/send-otp",
    app,
    asyncRoute(async (req, res) => {
      const { email } = req.body;
      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "لطفاً یک ایمیل سازمانی معتبر وارد نمایید" });
      }
      const normalizedEmail = email.trim().toLowerCase();
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await store.setVerificationCode(
        normalizedEmail,
        "login_otp",
        code,
        new Date(Date.now() + 10 * 60 * 1000),
      );
      res.json({
        success: true,
        message: `کد تأیید ۶ رقمی به آدرس ${normalizedEmail} ارسال شد`,
        simulatedCode: process.env.NODE_ENV !== "production" ? code : undefined,
      });
    }),
  );

  bindAuth(
    "/auth/verify-otp",
    app,
    asyncRoute(async (req, res) => {
      const { email, code } = req.body;
      if (!email || !code) return res.status(400).json({ error: "ایمیل و کد تأیید الزامی هستند" });
      const normalizedEmail = email.trim().toLowerCase();
      const stored = await store.getVerificationCode(normalizedEmail, "login_otp");
      const isCodeValid =
        (stored && stored.code === code.trim() && Date.now() <= stored.expiresAt) ||
        (process.env.NODE_ENV !== "production" && code.trim() === "123456");
      if (!isCodeValid) {
        return res.status(400).json({ error: "کد تأیید وارد شده نامعتبر است یا منقضی شده است" });
      }
      await store.deleteVerificationCode(normalizedEmail, "login_otp");
      let user = await store.findUserByEmail(normalizedEmail);
      let isNewUser = false;
      if (!user) {
        isNewUser = true;
        const orgs = await store.listOrganizations();
        const defaultOrg = orgs[0];
        user = await store.insertUser({
          id: `usr-${Date.now()}`,
          organizationId: defaultOrg.id,
          employeeNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
          firstName: "",
          lastName: "",
          name: normalizedEmail.split("@")[0],
          email: normalizedEmail,
          status: "ACTIVE",
          role: "EMPLOYEE",
          department: defaultOrg.departments?.[0] || "عمومی",
          jobTitle: "کارشناس",
          phone: "",
          isProfileComplete: false,
          orgName: defaultOrg.name,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        });
      }
      const { issueSessionForUser } = await import("./session.service");
      const session = await issueSessionForUser(user!);
      session.isNewUser = isNewUser;
      res.json(session);
    }),
  );

  bindAuth(
    "/auth/forgot-password",
    app,
    asyncRoute(async (req, res) => {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "لطفاً آدرس ایمیل خود را وارد کنید" });
      const normalizedEmail = email.trim().toLowerCase();
      const user = await store.findUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(404).json({ error: "کاربری با این آدرس ایمیل در پلتفرم روم‌چی ثبت نشده است" });
      }
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await store.setVerificationCode(
        normalizedEmail,
        "password_reset",
        code,
        new Date(Date.now() + 15 * 60 * 1000),
      );
      await writeAuthAudit({
        req,
        userId: user.id,
        organizationId: user.organizationId,
        provider: "local",
        action: "password_reset",
        success: true,
        metadata: { stage: "requested" },
      });
      res.json({
        success: true,
        message: `کد بازنشانی به ${normalizedEmail} ارسال شد`,
        simulatedCode: process.env.NODE_ENV !== "production" ? code : undefined,
      });
    }),
  );

  bindAuth(
    "/auth/reset-password",
    app,
    asyncRoute(async (req, res) => {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: "ایمیل، کد و رمز جدید الزامی است" });
      }
      const normalizedEmail = email.trim().toLowerCase();
      const stored = await store.getVerificationCode(normalizedEmail, "password_reset");
      if (!stored || stored.code !== code.trim() || Date.now() > stored.expiresAt) {
        return res.status(400).json({ error: "کد نامعتبر یا منقضی شده است" });
      }
      const user = await store.findUserByEmail(normalizedEmail);
      if (!user) return res.status(404).json({ error: "کاربر یافت نشد" });
      const hashed = await normalizePasswordForStorage(newPassword.trim());
      await store.updateUser(user.id, { password: hashed });
      await store.deleteVerificationCode(normalizedEmail, "password_reset");
      res.json({ success: true, message: "رمز عبور بازنشانی شد" });
    }),
  );

  bindAuth(
    "/auth/complete-profile",
    app,
    asyncRoute(async (req, res) => {
      const caller = extractJwtUser(req);
      const { userId, email, name, phone, department, jobTitle, password } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: "نام و نام خانوادگی الزامی است" });
      if (!phone?.trim()) return res.status(400).json({ error: "شماره همراه الزامی است" });

      let targetUser = caller?.userId ? await store.getUserById(caller.userId) : null;
      if (!targetUser && userId) targetUser = await store.getUserById(userId);
      if (!targetUser && email) targetUser = await store.findUserByEmail(email);
      if (!targetUser) return res.status(404).json({ error: "کاربر مورد نظر یافت نشد" });

      const trimmedName = name.trim();
      const patch: Record<string, unknown> = {
        name: trimmedName,
        firstName: trimmedName.split(" ")[0],
        lastName: trimmedName.split(" ").slice(1).join(" "),
        phone: phone.trim(),
        isProfileComplete: true,
      };
      if (department) patch.department = department.trim();
      if (jobTitle) patch.jobTitle = jobTitle.trim();
      if (password && password.trim().length >= 8) {
        patch.password = await normalizePasswordForStorage(password.trim());
      }

      const updated = await store.updateUser(targetUser.id, patch as Parameters<typeof store.updateUser>[1]);
      res.json({
        success: true,
        message: "مشخصات شما با موفقیت تکمیل و ثبت شد",
        user: stripPassword(updated!),
      });
    }),
  );
}
