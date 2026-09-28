import type { Express } from "express";
import type { Organization } from "../types";
import { asyncRoute } from "../http";
import * as store from "../persistence/store";
import {
  getOrganizationAuthSettings,
  upsertOrganizationAuthSettings,
} from "../auth/auth-settings.store";
import type { GoogleConfiguration, LdapConfiguration, OrganizationAuthSettings } from "../auth/types";
import { testLdapConnection, testLdapUserLookup } from "../auth/providers/ldap.provider";
import { testGoogleConfiguration, testSmtpConfiguration } from "../installation/setup.service";
import { listIntegrations, upsertIntegration } from "../installation/integrations.store";
import { requireAdminPermission } from "./admin-guard";
import { writeConfigAudit, listConfigAuditLogs } from "./config-audit.service";
import { getSystemSettings, upsertSystemSettings } from "./system-settings.store";
import type { SystemSettings } from "./system-settings.store";

const MASK = "••••••••";

function maskAuthSettings(settings: OrganizationAuthSettings) {
  return {
    organizationId: settings.organizationId,
    localEnabled: settings.localEnabled,
    ldapEnabled: settings.ldapEnabled,
    googleEnabled: settings.googleEnabled,
    ldapConfiguration: {
      ...settings.ldapConfiguration,
      bindPassword: settings.ldapConfiguration.bindPassword ? MASK : "",
    },
    googleConfiguration: {
      ...settings.googleConfiguration,
      clientSecret: settings.googleConfiguration.clientSecret ? MASK : "",
    },
    authPolicies: settings.authPolicies,
  };
}

function mergeLdapSecrets(
  current: LdapConfiguration,
  patch: LdapConfiguration,
): LdapConfiguration {
  const merged = { ...current, ...patch };
  if (!patch.bindPassword || patch.bindPassword === MASK) {
    merged.bindPassword = current.bindPassword;
  }
  return merged;
}

function mergeGoogleSecrets(
  current: GoogleConfiguration,
  patch: GoogleConfiguration,
): GoogleConfiguration {
  const merged = { ...current, ...patch };
  if (!patch.clientSecret || patch.clientSecret === MASK) {
    merged.clientSecret = current.clientSecret;
  }
  return merged;
}

function orgAdminPayload(org: Awaited<ReturnType<typeof store.getOrganizationById>>) {
  if (!org) return null;
  const settings = (org.settings || {}) as Record<string, unknown>;
  return {
    id: org.id,
    name: org.name,
    code: org.code,
    domain: org.domain,
    contactEmail: org.contactEmail,
    logo: org.logo,
    primaryColor: org.primaryColor,
    slug: org.slug,
    country: settings.country ?? "IR",
    timezone: settings.timezone ?? "Asia/Tehran",
    language: settings.language ?? "fa",
    dateFormat: settings.dateFormat ?? "jalali",
    workHours: org.workHours,
    bookingSettings: org.settings,
  };
}

export function registerAdminRoutes(app: Express): void {
  app.get("/api/admin/organization", asyncRoute(async (req, res) => {
    const caller = requireAdminPermission(req, res, "manage_organization_settings");
    if (!caller) return;
    const org = await store.getOrganizationById(caller.organizationId);
    if (!org) return res.status(404).json({ error: "سازمان یافت نشد" });
    res.json(orgAdminPayload(org));
  }));

  app.put("/api/admin/organization", asyncRoute(async (req, res) => {
    const caller = requireAdminPermission(req, res, "manage_organization_settings");
    if (!caller) return;
    const beforeOrg = await store.getOrganizationById(caller.organizationId);
    if (!beforeOrg) return res.status(404).json({ error: "سازمان یافت نشد" });

    const body = req.body as Record<string, unknown>;
    const settings = {
      ...(beforeOrg.settings || {}),
      country: body.country,
      timezone: body.timezone,
      language: body.language,
      dateFormat: body.dateFormat,
      autoApprove: (body.bookingSettings as Record<string, unknown>)?.autoApprove ?? beforeOrg.settings?.autoApprove,
      maxBookingHours:
        (body.bookingSettings as Record<string, unknown>)?.maxBookingHours ??
        beforeOrg.settings?.maxBookingHours,
      allowWeekend:
        (body.bookingSettings as Record<string, unknown>)?.allowWeekend ??
        beforeOrg.settings?.allowWeekend,
    };

    const updated = await store.patchOrganization(caller.organizationId, {
      name: body.name as string,
      code: body.code as string,
      domain: body.domain as string,
      contactEmail: body.contactEmail as string,
      logo: body.logo as string,
      primaryColor: body.primaryColor as string,
      workHours: body.workHours as Organization["workHours"],
      settings: settings as unknown as Organization["settings"],
    });

    await writeConfigAudit({
      req,
      organizationId: caller.organizationId,
      userId: caller.userId,
      eventType: "ORGANIZATION_UPDATED",
      summary: "Organization settings updated",
      before: orgAdminPayload(beforeOrg) as Record<string, unknown>,
      after: orgAdminPayload(updated) as Record<string, unknown>,
    });

    res.json(orgAdminPayload(updated));
  }));

  app.get("/api/admin/auth-settings", asyncRoute(async (req, res) => {
    const caller = requireAdminPermission(req, res, "manage_authentication_settings");
    if (!caller) return;
    const settings = await getOrganizationAuthSettings(caller.organizationId);
    const system = await getSystemSettings(caller.organizationId);
    res.json({
      ...maskAuthSettings(settings),
      passwordPolicy: system.security,
    });
  }));

  app.put("/api/admin/auth-settings", asyncRoute(async (req, res) => {
    const caller = requireAdminPermission(req, res, "manage_authentication_settings");
    if (!caller) return;
    const before = await getOrganizationAuthSettings(caller.organizationId);
    const body = req.body as Record<string, unknown>;

    const ldapPatch = (body.ldapConfiguration || {}) as LdapConfiguration;
    const googlePatch = (body.googleConfiguration || {}) as GoogleConfiguration;

    const updated = await upsertOrganizationAuthSettings(caller.organizationId, {
      localEnabled: body.localEnabled as boolean | undefined,
      ldapEnabled: body.ldapEnabled as boolean | undefined,
      googleEnabled: body.googleEnabled as boolean | undefined,
      ldapConfiguration: mergeLdapSecrets(before.ldapConfiguration, ldapPatch),
      googleConfiguration: mergeGoogleSecrets(before.googleConfiguration, googlePatch),
      authPolicies: body.authPolicies as OrganizationAuthSettings["authPolicies"],
    });

    if (body.passwordPolicy) {
      await upsertSystemSettings(caller.organizationId, {
        security: body.passwordPolicy as SystemSettings["security"],
      });
    }

    await writeConfigAudit({
      req,
      organizationId: caller.organizationId,
      userId: caller.userId,
      eventType: "AUTH_PROVIDER_UPDATED",
      summary: "Authentication providers updated",
      before: maskAuthSettings(before) as Record<string, unknown>,
      after: maskAuthSettings(updated) as Record<string, unknown>,
    });

    res.json(maskAuthSettings(updated));
  }));

  app.post("/api/admin/auth-settings/test-ldap", asyncRoute(async (req, res) => {
    const caller = requireAdminPermission(req, res, "manage_authentication_settings");
    if (!caller) return;
    const ldap = req.body?.ldap as LdapConfiguration;
    const result = await testLdapConnection(ldap);
    res.status(result.ok ? 200 : 400).json(result);
  }));

  app.post("/api/admin/auth-settings/test-ldap-user", asyncRoute(async (req, res) => {
    const caller = requireAdminPermission(req, res, "manage_authentication_settings");
    if (!caller) return;
    const { ldap, username } = req.body as { ldap: LdapConfiguration; username: string };
    const result = await testLdapUserLookup(ldap, username);
    res.status(result.ok ? 200 : 400).json(result);
  }));

  app.post("/api/admin/auth-settings/test-google", asyncRoute(async (req, res) => {
    const caller = requireAdminPermission(req, res, "manage_authentication_settings");
    if (!caller) return;
    const google = req.body?.google as GoogleConfiguration;
    const result = await testGoogleConfiguration(google);
    res.status(result.ok ? 200 : 400).json(result);
  }));

  app.get("/api/admin/integrations", asyncRoute(async (req, res) => {
    const caller = requireAdminPermission(req, res, "manage_integrations");
    if (!caller) return;
    const list = await listIntegrations(caller.organizationId);
    const smtp = list.find((i) => i.provider === "smtp");
    const storage = list.find((i) => i.provider === "storage");
    res.json({
      smtp: smtp
        ? {
            ...smtp.config,
            password: smtp.config.password ? MASK : "",
            enabled: smtp.enabled,
          }
        : { enabled: false },
      storage: storage
        ? { ...storage.config, secretKey: storage.config.secretKey ? MASK : "", enabled: storage.enabled }
        : { type: "local", uploadPath: "./uploads", enabled: true },
    });
  }));

  app.put("/api/admin/integrations", asyncRoute(async (req, res) => {
    const caller = requireAdminPermission(req, res, "manage_integrations");
    if (!caller) return;
    const before = await listIntegrations(caller.organizationId);
    const body = req.body as {
      smtp?: Record<string, unknown> & { enabled?: boolean };
      storage?: Record<string, unknown> & { enabled?: boolean; type?: string };
    };

    if (body.smtp) {
      const prev = before.find((i) => i.provider === "smtp")?.config || {};
      const pwd = body.smtp.password;
      const merged = {
        ...prev,
        ...body.smtp,
        password:
          !pwd || pwd === MASK ? prev.password : pwd,
      };
      delete merged.enabled;
      await upsertIntegration(caller.organizationId, "smtp", merged, body.smtp.enabled !== false);
    }

    if (body.storage) {
      const prev = before.find((i) => i.provider === "storage")?.config || {};
      const sk = body.storage.secretKey;
      const merged = {
        ...prev,
        ...body.storage,
        secretKey: !sk || sk === MASK ? prev.secretKey : sk,
      };
      delete merged.enabled;
      await upsertIntegration(caller.organizationId, "storage", merged, body.storage.enabled !== false);
    }

    await writeConfigAudit({
      req,
      organizationId: caller.organizationId,
      userId: caller.userId,
      eventType: "INTEGRATION_UPDATED",
      summary: "Integrations updated",
      before: { smtp: !!before.find((i) => i.provider === "smtp"), storage: !!before.find((i) => i.provider === "storage") },
      after: { smtp: !!body.smtp, storage: !!body.storage },
    });

    const list = await listIntegrations(caller.organizationId);
    res.json({ success: true, integrations: list.map((i) => i.provider) });
  }));

  app.post("/api/admin/integrations/test-smtp", asyncRoute(async (req, res) => {
    const caller = requireAdminPermission(req, res, "manage_integrations");
    if (!caller) return;
    const smtp = req.body?.smtp;
    const result = await testSmtpConfiguration(smtp);
    res.status(result.ok ? 200 : 400).json(result);
  }));

  app.post("/api/admin/integrations/test-storage", asyncRoute(async (req, res) => {
    const caller = requireAdminPermission(req, res, "manage_integrations");
    if (!caller) return;
    const type = String(req.body?.type || "local");
    if (type === "local") {
      const path = String(req.body?.uploadPath || "./uploads");
      return res.json({ ok: true, message: `Local storage path configured: ${path}` });
    }
    res.json({ ok: false, message: "S3/MinIO connection test will be available in a future release." });
  }));

  app.get("/api/admin/system-settings", asyncRoute(async (req, res) => {
    const caller = requireAdminPermission(req, res, "manage_system_settings");
    if (!caller) return;
    res.json(await getSystemSettings(caller.organizationId));
  }));

  app.put("/api/admin/system-settings", asyncRoute(async (req, res) => {
    const caller = requireAdminPermission(req, res, "manage_system_settings");
    if (!caller) return;
    const before = await getSystemSettings(caller.organizationId);
    const updated = await upsertSystemSettings(caller.organizationId, req.body);
    await writeConfigAudit({
      req,
      organizationId: caller.organizationId,
      userId: caller.userId,
      eventType: "SYSTEM_SETTING_UPDATED",
      summary: "System settings updated",
      before: before as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    });
    res.json(updated);
  }));

  app.get("/api/admin/config-audit", asyncRoute(async (req, res) => {
    const caller = requireAdminPermission(req, res, "manage_organization_settings");
    if (!caller) return;
    const logs = await listConfigAuditLogs(caller.organizationId, 40);
    res.json(logs);
  }));
}
