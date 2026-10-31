import nodemailer from "nodemailer";
import { getIntegration } from "../installation/integrations.store";
import type { SetupSmtpInput } from "../installation/setup.service";
import {
  buildPasswordResetMail,
  buildRegistrationOtpMail,
  buildTestMail,
  resolveOrgMailBranding,
} from "./mail-templates";

export type ResendConfig = {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
};

export type MailSendInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  organizationId?: string;
};

export type MailSendResult = { ok: true; provider: "resend" | "smtp" } | { ok: false; message: string };

type ResolvedMail = {
  resend: ResendConfig | null;
  smtp: SetupSmtpInput | null;
};

function envResend(): ResendConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = (process.env.RESEND_FROM || process.env.SMTP_FROM)?.trim();
  if (!apiKey || !fromEmail) return null;
  return { apiKey, fromEmail, fromName: process.env.RESEND_FROM_NAME?.trim() };
}

function envSmtp(): SetupSmtpInput | null {
  const host = process.env.SMTP_HOST?.trim();
  const fromEmail = process.env.SMTP_FROM?.trim();
  if (!host || !fromEmail) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  return {
    host,
    port,
    username: process.env.SMTP_USER?.trim() || "",
    password: process.env.SMTP_PASSWORD || "",
    fromEmail,
    fromName: process.env.SMTP_FROM_NAME?.trim(),
  };
}

export async function resolveMailConfig(organizationId?: string): Promise<ResolvedMail> {
  let resend: ResendConfig | null = null;
  let smtp: SetupSmtpInput | null = null;

  if (organizationId) {
    const r = await getIntegration(organizationId, "resend");
    if (r?.enabled && r.config.apiKey && r.config.fromEmail) {
      resend = {
        apiKey: String(r.config.apiKey),
        fromEmail: String(r.config.fromEmail),
        fromName: r.config.fromName ? String(r.config.fromName) : undefined,
      };
    }
    const s = await getIntegration(organizationId, "smtp");
    if (s?.enabled && s.config.host && s.config.fromEmail) {
      smtp = {
        host: String(s.config.host),
        port: Number(s.config.port || 587),
        username: s.config.username ? String(s.config.username) : "",
        password: s.config.password ? String(s.config.password) : "",
        fromEmail: String(s.config.fromEmail),
        fromName: s.config.fromName ? String(s.config.fromName) : undefined,
      };
    }
  }

  if (!resend) resend = envResend();
  if (!smtp) smtp = envSmtp();

  return { resend, smtp };
}

function formatFrom(cfg: { fromEmail: string; fromName?: string }): string {
  if (cfg.fromName?.trim()) {
    return `"${cfg.fromName.replace(/"/g, "")}" <${cfg.fromEmail}>`;
  }
  return cfg.fromEmail;
}

async function sendViaResend(cfg: ResendConfig, input: MailSendInput): Promise<MailSendResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: formatFrom(cfg),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, message: body || `Resend HTTP ${res.status}` };
  }
  return { ok: true, provider: "resend" };
}

async function sendViaSmtp(cfg: SetupSmtpInput, input: MailSendInput): Promise<MailSendResult> {
  const secure =
    process.env.SMTP_SECURE === "true" || cfg.port === 465;
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure,
    auth: cfg.username
      ? { user: cfg.username, pass: cfg.password || "" }
      : undefined,
  });
  try {
    await transporter.sendMail({
      from: formatFrom(cfg),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { ok: true, provider: "smtp" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "ارسال SMTP ناموفق بود";
    return { ok: false, message };
  }
}

function withOrgSenderName<T extends { fromEmail: string; fromName?: string }>(
  cfg: T,
  organizationName?: string,
): T {
  if (cfg.fromName?.trim() || !organizationName?.trim()) return cfg;
  return { ...cfg, fromName: organizationName.trim() };
}

export async function sendEmail(input: MailSendInput): Promise<MailSendResult> {
  const { resend, smtp } = await resolveMailConfig(input.organizationId);
  const branding = await resolveOrgMailBranding(input.organizationId);
  const resendCfg = resend ? withOrgSenderName(resend, branding.organizationName) : null;
  const smtpCfg = smtp ? withOrgSenderName(smtp, branding.organizationName) : null;

  if (resendCfg) {
    const result = await sendViaResend(resendCfg, input);
    if (result.ok) return result;
    if (smtpCfg) {
      const fallback = await sendViaSmtp(smtpCfg, input);
      if (fallback.ok) return fallback;
      return { ok: false, message: `Resend: ${result.message}; SMTP: ${fallback.message}` };
    }
    return result;
  }

  if (smtpCfg) return sendViaSmtp(smtpCfg, input);

  return {
    ok: false,
    message: "ارسال ایمیل پیکربندی نشده است (Resend یا SMTP را در پنل یکپارچه‌سازی تنظیم کنید).",
  };
}

export function isMailConfigured(organizationId?: string): Promise<boolean> {
  return resolveMailConfig(organizationId).then(({ resend, smtp }) => Boolean(resend || smtp));
}

export async function sendOtpEmail(params: {
  to: string;
  code: string;
  organizationId?: string;
  minutesValid?: number;
}): Promise<MailSendResult> {
  const minutesValid = params.minutesValid ?? 10;
  const branding = await resolveOrgMailBranding(params.organizationId);
  const { subject, html, text } = buildRegistrationOtpMail({
    branding,
    code: params.code,
    minutesValid,
  });
  return sendEmail({
    to: params.to,
    subject,
    html,
    text,
    organizationId: params.organizationId,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  code: string;
  organizationId?: string;
  minutesValid?: number;
}): Promise<MailSendResult> {
  const minutesValid = params.minutesValid ?? 15;
  const branding = await resolveOrgMailBranding(params.organizationId);
  const { subject, html, text } = buildPasswordResetMail({
    branding,
    code: params.code,
    minutesValid,
  });
  return sendEmail({
    to: params.to,
    subject,
    html,
    text,
    organizationId: params.organizationId,
  });
}

export async function sendTestEmail(params: {
  to: string;
  organizationId?: string;
  resend?: ResendConfig | null;
  smtp?: SetupSmtpInput | null;
}): Promise<MailSendResult> {
  const branding = await resolveOrgMailBranding(params.organizationId);
  const testMail = buildTestMail(branding);
  const subject = testMail.subject;
  const text = testMail.text;
  const html = testMail.html;

  if (params.resend?.apiKey && params.resend.fromEmail) {
    const result = await sendViaResend(params.resend, {
      to: params.to,
      subject,
      html,
      text,
    });
    if (result.ok) return result;
    if (params.smtp?.host) {
      const fallback = await sendViaSmtp(params.smtp, {
        to: params.to,
        subject,
        html,
        text,
      });
      if (fallback.ok) return fallback;
      return { ok: false, message: `Resend: ${result.message}; SMTP: ${fallback.message}` };
    }
    return result;
  }

  if (params.smtp?.host) {
    return sendViaSmtp(params.smtp, {
      to: params.to,
      subject,
      html,
      text,
    });
  }

  return sendEmail({
    to: params.to,
    subject,
    html,
    text,
    organizationId: params.organizationId,
  });
}
