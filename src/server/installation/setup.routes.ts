import type { Express, Request, Response } from "express";
import { asyncRoute } from "../http";
import { getInstallationStatus, isInstallationInitialized } from "./installation.store";
import {
  completeInstallation,
  testGoogleConfiguration,
  testSmtpConfiguration,
  type SetupCompletePayload,
} from "./setup.service";
import { testLdapConnection } from "../auth/providers/ldap.provider";
import type { GoogleConfiguration, LdapConfiguration } from "../auth/types";
import { runSetupPreflight } from "../enterprise/preflight.service";

async function ensureSetupAllowed(_req: Request, res: Response): Promise<boolean> {
  if (await isInstallationInitialized()) {
    res.status(403).json({
      error: "SetupDisabled",
      message: "نصب اولیه قبلاً انجام شده است. /setup غیرفعال است.",
    });
    return false;
  }
  return true;
}

export function registerSetupRoutes(app: Express): void {
  app.get("/api/setup/preflight", asyncRoute(async (_req, res) => {
    if (await isInstallationInitialized()) {
      return res.status(403).json({ error: "SetupDisabled" });
    }
    const result = await runSetupPreflight();
    res.status(result.ok ? 200 : 503).json(result);
  }));

  app.get("/api/setup/status", asyncRoute(async (_req, res) => {
    const status = await getInstallationStatus();
    res.json({
      initialized: status.initialized,
      organizationCreated: status.organizationCreated,
      adminCreated: status.adminCreated,
      completedAt: status.completedAt,
    });
  }));

  app.post("/api/setup/test-ldap", asyncRoute(async (req, res) => {
    if (!(await ensureSetupAllowed(req, res))) return;
    const ldap = req.body?.ldap as LdapConfiguration | undefined;
    if (!ldap) return res.status(400).json({ error: "پیکربندی LDAP ارسال نشده است" });
    const result = await testLdapConnection(ldap);
    res.status(result.ok ? 200 : 400).json(result);
  }));

  app.post("/api/setup/test-google", asyncRoute(async (req, res) => {
    if (!(await ensureSetupAllowed(req, res))) return;
    const google = req.body?.google as GoogleConfiguration | undefined;
    if (!google) return res.status(400).json({ error: "پیکربندی Google ارسال نشده است" });
    const result = await testGoogleConfiguration(google);
    res.status(result.ok ? 200 : 400).json(result);
  }));

  app.post("/api/setup/test-smtp", asyncRoute(async (req, res) => {
    if (!(await ensureSetupAllowed(req, res))) return;
    const smtp = req.body?.smtp;
    if (!smtp?.host) return res.status(400).json({ error: "تنظیمات SMTP ناقص است" });
    const result = await testSmtpConfiguration(smtp);
    res.status(result.ok ? 200 : 400).json(result);
  }));

  app.post("/api/setup/complete", asyncRoute(async (req, res) => {
    if (!(await ensureSetupAllowed(req, res))) return;
    const payload = req.body as SetupCompletePayload;
    if (!payload?.organization?.name || !payload?.admin?.email || !payload?.admin?.password) {
      return res.status(400).json({ error: "اطلاعات سازمان و مدیر الزامی است" });
    }
    const confirmPassword = String(req.body?.admin?.confirmPassword ?? "");
    if (!confirmPassword) {
      return res.status(400).json({ error: "تأیید رمز عبور الزامی است" });
    }
    if (payload.admin.password !== confirmPassword) {
      return res.status(400).json({ error: "رمز عبور و تأیید آن یکسان نیست" });
    }
    if (payload.admin.password.length < 8) {
      return res.status(400).json({ error: "رمز عبور باید حداقل ۸ کاراکتر باشد" });
    }

    const { organization, session } = await completeInstallation(req, payload);
    res.json({
      success: true,
      organization,
      accessToken: session.accessToken,
      token: session.token,
      user: session.user,
      message: session.message,
    });
  }));
}
