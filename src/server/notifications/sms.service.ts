import { getIntegration } from "../installation/integrations.store";
import { LDAP_BIND_PASSWORD_MASK } from "../auth/ldap-config.util";
import https from "node:https";
import { formatOutboundTlsError, getOutboundHttpsAgent } from "../http/outbound-https";

export type SmsProviderId = "kavenegar" | "magfa" | "farazsms" | "ghasedak" | "custom";

export type ResolvedSmsConfig = {
  provider: SmsProviderId;
  apiKey: string;
  lineNumber: string;
  managerPhone?: string;
  customWebhookUrl?: string;
  enabled: boolean;
};

export type SmsSendResult = { ok: boolean; message: string };

const MASK = LDAP_BIND_PASSWORD_MASK;

export function mergeSmsConfigInput(
  partial: Record<string, unknown> | undefined,
  stored: Record<string, unknown> | undefined,
): ResolvedSmsConfig | null {
  const prev = stored || {};
  const keyRaw = partial?.apiKey;
  const apiKey = String(
    !keyRaw || keyRaw === MASK ? prev.apiKey || "" : keyRaw,
  ).trim();
  const lineNumber = String(partial?.lineNumber ?? prev.lineNumber ?? "").trim();
  const provider = String(partial?.provider ?? prev.provider ?? "kavenegar") as SmsProviderId;
  if (!apiKey || !lineNumber) return null;
  return {
    provider,
    apiKey,
    lineNumber,
    managerPhone: String(partial?.managerPhone ?? prev.managerPhone ?? "").trim() || undefined,
    customWebhookUrl: String(partial?.customWebhookUrl ?? prev.customWebhookUrl ?? "").trim() || undefined,
    enabled: partial?.enabled !== false && partial?.enabled !== "false",
  };
}

export async function resolveSmsConfig(organizationId: string): Promise<ResolvedSmsConfig | null> {
  const row = await getIntegration(organizationId, "sms");
  if (!row?.enabled) return null;
  return mergeSmsConfigInput({}, row.config);
}

export function normalizeIranMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("09")) return digits;
  if (digits.length === 10 && digits.startsWith("9")) return `0${digits}`;
  if (digits.length === 12 && digits.startsWith("98")) return `0${digits.slice(2)}`;
  return null;
}

const SMS_OUTBOUND_TIMEOUT_MS = 25_000;

function postHttpsForm(
  hostname: string,
  path: string,
  form: URLSearchParams,
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = form.toString();
    const req = https.request(
      {
        hostname,
        port: 443,
        path,
        method: "POST",
        family: 4,
        agent: getOutboundHttpsAgent(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Content-Length": Buffer.byteLength(payload, "utf8"),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk as Buffer));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode || 0,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );

    req.setTimeout(SMS_OUTBOUND_TIMEOUT_MS, () => {
      req.destroy(new Error("SMS_OUTBOUND_TIMEOUT"));
    });

    req.on("error", (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

async function outboundFetch(url: string, init: RequestInit): Promise<Response> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), SMS_OUTBOUND_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ac.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        "مهلت اتصال به سرویس پیامک (۲۵ ثانیه) تمام شد. دسترسی سرور به api.kavenegar.com، VPN، یا فایروال را بررسی کنید.",
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function sendViaKavenegar(
  config: ResolvedSmsConfig,
  receptor: string,
  message: string,
): Promise<SmsSendResult> {
  const apiKey = config.apiKey.trim();
  const path = `/v1/${encodeURIComponent(apiKey)}/sms/send.json`;
  const form = new URLSearchParams({
    receptor,
    sender: config.lineNumber.trim(),
    message,
  });
  let httpRes: { statusCode: number; body: string };
  try {
    httpRes = await postHttpsForm("api.kavenegar.com", path, form);
  } catch (err) {
    if (err instanceof Error && err.message === "SMS_OUTBOUND_TIMEOUT") {
      return {
        ok: false,
        message:
          "مهلت اتصال به کاوه‌نگار (۲۵ ثانیه) تمام شد. اینترنت سرور، VPN، یا فایروال outbound را بررسی کنید.",
      };
    }
    return { ok: false, message: formatOutboundTlsError(err) };
  }
  let data: { return?: { status?: number; message?: string } };
  try {
    data = JSON.parse(httpRes.body) as typeof data;
  } catch {
    return {
      ok: false,
      message: httpRes.body?.slice(0, 200) || "پاسخ نامعتبر از سرویس پیامک",
    };
  }
  const status = data.return?.status;
  if (status !== 200) {
    return {
      ok: false,
      message: data.return?.message || `خطای کاوه‌نگار (کد ${status ?? httpRes.statusCode})`,
    };
  }
  return { ok: true, message: "پیامک با موفقیت ارسال شد." };
}

async function sendViaCustomWebhook(
  config: ResolvedSmsConfig,
  receptor: string,
  message: string,
): Promise<SmsSendResult> {
  const hook = config.customWebhookUrl?.trim();
  if (!hook) {
    return { ok: false, message: "آدرس Webhook سفارشی تنظیم نشده است." };
  }
  try {
    const res = await outboundFetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: receptor,
        message,
        lineNumber: config.lineNumber,
        apiKey: config.apiKey,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, message: text || `Webhook HTTP ${res.status}` };
    }
    return { ok: true, message: "درخواست به وب‌هوک پیامک ارسال شد." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطای شبکه";
    return { ok: false, message: msg };
  }
}

export async function sendSmsWithConfig(
  config: ResolvedSmsConfig,
  to: string,
  message: string,
): Promise<SmsSendResult> {
  const receptor = normalizeIranMobile(to);
  if (!receptor) {
    return { ok: false, message: "شماره موبایل معتبر نیست (مثال: 09123456789)." };
  }
  const body = message.trim();
  if (!body) return { ok: false, message: "متن پیام خالی است." };

  if (config.provider === "custom") {
    return sendViaCustomWebhook(config, receptor, body);
  }
  if (config.provider !== "kavenegar") {
    return {
      ok: false,
      message: `ارسال زنده فعلاً فقط برای کاوه‌نگار و Webhook سفارشی پشتیبانی می‌شود (انتخاب شما: ${config.provider}).`,
    };
  }
  return sendViaKavenegar(config, receptor, body);
}

export async function sendOrgSms(
  organizationId: string,
  to: string,
  message: string,
): Promise<SmsSendResult> {
  const config = await resolveSmsConfig(organizationId);
  if (!config) {
    return {
      ok: false,
      message: "اتصال SMS در یکپارچه‌سازی‌ها فعال یا کامل نیست (API Key و خط ارسال).",
    };
  }
  return sendSmsWithConfig(config, to, message);
}

export async function testSmsConfiguration(input: {
  organizationId: string;
  sms?: Record<string, unknown>;
  receptor?: string;
  message?: string;
}): Promise<SmsSendResult> {
  const stored = await getIntegration(input.organizationId, "sms");
  const config = mergeSmsConfigInput(input.sms, stored?.config);
  if (!config) {
    return { ok: false, message: "API Key و شماره خط (Sender) الزامی است." };
  }
  const to =
    input.receptor?.trim() ||
    config.managerPhone ||
    "";
  if (!to) {
    return { ok: false, message: "شماره گیرنده تست را وارد کنید (موبایل مدیر یا فیلد تست)." };
  }
  const message =
    input.message?.trim() ||
    "Rooomchi SMS test — connection OK.";
  return sendSmsWithConfig(config, to, message);
}

const SMS_TEST_HARD_LIMIT_MS = 28_000;

export function testSmsConfigurationWithDeadline(
  input: Parameters<typeof testSmsConfiguration>[0],
): Promise<SmsSendResult> {
  return Promise.race([
    testSmsConfiguration(input),
    new Promise<SmsSendResult>((resolve) => {
      setTimeout(() => {
        resolve({
          ok: false,
          message:
            "ارسال تست بیش از حد طول کشید. اتصال outbound سرور به api.kavenegar.com را بررسی کنید (VPN/فایروال).",
        });
      }, SMS_TEST_HARD_LIMIT_MS);
    }),
  ]);
}
