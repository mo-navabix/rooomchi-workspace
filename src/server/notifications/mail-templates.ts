import * as store from "../persistence/store";

export type OrgMailBranding = {
  organizationName: string;
  accentColor: string;
};

const DEFAULT_ACCENT = "#c41e3a";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

export async function resolveOrgMailBranding(organizationId?: string): Promise<OrgMailBranding> {
  const fallbackName =
    process.env.MAIL_ORG_FALLBACK_NAME?.trim() || "پورتال سازمان";
  if (!organizationId) {
    return { organizationName: fallbackName, accentColor: DEFAULT_ACCENT };
  }
  const org = await store.getOrganizationById(organizationId);
  if (!org?.name?.trim()) {
    return { organizationName: fallbackName, accentColor: DEFAULT_ACCENT };
  }
  const accent =
    org.primaryColor && isHexColor(org.primaryColor)
      ? org.primaryColor.trim()
      : DEFAULT_ACCENT;
  return { organizationName: org.name.trim(), accentColor: accent };
}

type TransactionalMailKind = "registration_otp" | "password_reset";

function buildTransactionalHtml(params: {
  branding: OrgMailBranding;
  kind: TransactionalMailKind;
  code: string;
  minutesValid: number;
}): string {
  const org = escapeHtml(params.branding.organizationName);
  const code = escapeHtml(params.code);
  const accent = escapeHtml(params.branding.accentColor);
  const minutes = String(params.minutesValid);

  const title =
    params.kind === "registration_otp"
      ? "کد تأیید ثبت‌نام"
      : "کد بازنشانی رمز عبور";
  const lead =
    params.kind === "registration_otp"
      ? `برای تکمیل ثبت‌نام در ${org}، کد زیر را در صفحه ثبت‌نام وارد کنید.`
      : `برای تعیین رمز عبور جدید در ${org}، کد زیر را وارد کنید.`;

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Tahoma,'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:${accent};padding:20px 24px;text-align:center;">
              <p style="margin:0;font-size:18px;font-weight:bold;color:#ffffff;">${org}</p>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.9);">${escapeHtml(title)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 8px;text-align:center;">
              <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">${lead}</p>
              <div style="display:inline-block;padding:16px 28px;border-radius:12px;background:#f8fafc;border:2px dashed ${accent};">
                <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0f172a;font-family:Consolas,monospace;">${code}</span>
              </div>
              <p style="margin:20px 0 0;font-size:13px;color:#64748b;">اعتبار این کد: <strong>${minutes} دقیقه</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 24px;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
                اگر این درخواست را شما ارسال نکرده‌اید، این ایمیل را نادیده بگیرید.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;">${org}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildTransactionalText(params: {
  branding: OrgMailBranding;
  kind: TransactionalMailKind;
  code: string;
  minutesValid: number;
}): string {
  const org = params.branding.organizationName;
  const intro =
    params.kind === "registration_otp"
      ? `کد تأیید ثبت‌نام در ${org}`
      : `کد بازنشانی رمز عبور ${org}`;
  return `${intro}

کد: ${params.code}

اعتبار: ${params.minutesValid} دقیقه

اگر این درخواست از طرف شما نبوده، این پیام را نادیده بگیرید.`;
}

export function buildRegistrationOtpMail(params: {
  branding: OrgMailBranding;
  code: string;
  minutesValid: number;
}): { subject: string; html: string; text: string } {
  const org = params.branding.organizationName;
  return {
    subject: `کد تأیید ثبت‌نام — ${org}`,
    html: buildTransactionalHtml({
      branding: params.branding,
      kind: "registration_otp",
      code: params.code,
      minutesValid: params.minutesValid,
    }),
    text: buildTransactionalText({
      branding: params.branding,
      kind: "registration_otp",
      code: params.code,
      minutesValid: params.minutesValid,
    }),
  };
}

export function buildPasswordResetMail(params: {
  branding: OrgMailBranding;
  code: string;
  minutesValid: number;
}): { subject: string; html: string; text: string } {
  const org = params.branding.organizationName;
  return {
    subject: `بازنشانی رمز عبور — ${org}`,
    html: buildTransactionalHtml({
      branding: params.branding,
      kind: "password_reset",
      code: params.code,
      minutesValid: params.minutesValid,
    }),
    text: buildTransactionalText({
      branding: params.branding,
      kind: "password_reset",
      code: params.code,
      minutesValid: params.minutesValid,
    }),
  };
}

export function buildTestMail(branding: OrgMailBranding): {
  subject: string;
  html: string;
  text: string;
} {
  const org = escapeHtml(branding.organizationName);
  const accent = escapeHtml(branding.accentColor);
  return {
    subject: `تست ارسال ایمیل — ${branding.organizationName}`,
    html: `<!DOCTYPE html><html lang="fa" dir="rtl"><body style="margin:0;padding:24px;background:#f1f5f9;font-family:Tahoma,sans-serif;">
<table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;">
<tr><td style="background:${accent};padding:16px;text-align:center;color:#fff;font-weight:bold;">${org}</td></tr>
<tr><td style="padding:24px;text-align:center;color:#334155;font-size:14px;line-height:1.7;">
<p style="margin:0 0 12px;">ایمیل آزمایشی با موفقیت ارسال شد.</p>
<p style="margin:0;color:#64748b;font-size:12px;">اگر این پیام را می‌بینید، تنظیمات Resend/SMTP سازمان شما درست است.</p>
</td></tr></table></body></html>`,
    text: `این یک ایمیل آزمایشی از ${branding.organizationName} است. اگر آن را دریافت کردید، تنظیمات ارسال ایمیل درست است.`,
  };
}
