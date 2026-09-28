import { createHash, randomBytes, randomUUID } from "crypto";
import type { Request } from "express";
import type { Organization } from "../../types";
import { query } from "../../persistence/db";
import { writeAuthAudit } from "../audit.service";
import { issueSessionForUser } from "../session.service";
import type { GoogleConfiguration, OrganizationAuthSettings } from "../types";
import { findIdentity, provisionUser } from "../identity.store";
import * as store from "../../persistence/store";
import { decryptSecret } from "../../security/secret-crypto";

function resolveGoogleConfig(settings: OrganizationAuthSettings): GoogleConfiguration {
  const c = settings.googleConfiguration;
  return {
    clientId: c.clientId || process.env.GOOGLE_CLIENT_ID,
    clientSecret: c.clientSecret
      ? decryptSecret(c.clientSecret)
      : process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: c.redirectUri || process.env.GOOGLE_REDIRECT_URI,
    allowedDomains: c.allowedDomains?.length ? c.allowedDomains : ["*"],
    autoProvision: c.autoProvision !== false,
    defaultRole: c.defaultRole || "EMPLOYEE",
  };
}

export async function createGoogleAuthUrl(params: {
  organization: Organization;
  settings: OrganizationAuthSettings;
  redirectAfter?: string;
}): Promise<{ url: string; state: string }> {
  if (!params.settings.googleEnabled) {
    throw Object.assign(new Error("ورود با گوگل برای این سازمان فعال نیست"), { statusCode: 403 });
  }
  const cfg = resolveGoogleConfig(params.settings);
  if (!cfg.clientId || !cfg.redirectUri) {
    throw Object.assign(new Error("پیکربندی Google OAuth ناقص است"), { statusCode: 500 });
  }

  const state = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await query(
    `INSERT INTO oauth_states (state, organization_id, provider, redirect_after, expires_at)
     VALUES ($1,$2,'google',$3,$4)`,
    [state, params.organization.id, params.redirectAfter || null, expiresAt],
  );

  const scope = encodeURIComponent("openid email profile");
  const url =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(cfg.clientId)}` +
    `&redirect_uri=${encodeURIComponent(cfg.redirectUri)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&state=${encodeURIComponent(state)}` +
    `&access_type=online` +
    `&prompt=select_account`;

  return { url, state };
}

type GoogleTokenResponse = {
  access_token: string;
  id_token: string;
  token_type: string;
};

type GoogleIdTokenPayload = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

function decodeJwtPayload(token: string): GoogleIdTokenPayload {
  const parts = token.split(".");
  if (parts.length < 2) throw new Error("Invalid id_token");
  const json = Buffer.from(parts[1], "base64url").toString("utf8");
  return JSON.parse(json) as GoogleIdTokenPayload;
}

async function exchangeCode(cfg: GoogleConfiguration, code: string): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: cfg.clientId!,
    client_secret: cfg.clientSecret!,
    redirect_uri: cfg.redirectUri!,
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw Object.assign(new Error("تبادل کد Google OAuth ناموفق بود"), { statusCode: 401 });
  }
  return (await res.json()) as GoogleTokenResponse;
}

function domainAllowed(email: string, allowed: string[]): boolean {
  if (allowed.includes("*")) return true;
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? allowed.map((d) => d.toLowerCase()).includes(domain) : false;
}

export async function handleGoogleCallback(params: {
  req: Request;
  code: string;
  state: string;
}): Promise<{ session: Awaited<ReturnType<typeof issueSessionForUser>>; redirectAfter: string | null }> {
  const { rows } = await query(
    `SELECT * FROM oauth_states WHERE state = $1 AND expires_at > NOW() LIMIT 1`,
    [params.state],
  );
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) {
    throw Object.assign(new Error("نشست OAuth نامعتبر یا منقضی شده است"), { statusCode: 400 });
  }

  const organizationId = String(row.organization_id);
  const org = await store.getOrganizationById(organizationId);
  if (!org) throw Object.assign(new Error("سازمان یافت نشد"), { statusCode: 404 });

  const { getOrganizationAuthSettings } = await import("../auth-settings.store");
  const settings = await getOrganizationAuthSettings(organizationId);
  if (!settings.googleEnabled) {
    throw Object.assign(new Error("Google OAuth غیرفعال است"), { statusCode: 403 });
  }

  const cfg = resolveGoogleConfig(settings);
  const tokens = await exchangeCode(cfg, params.code);
  const payload = decodeJwtPayload(tokens.id_token);

  if (!payload.email || !payload.sub) {
    throw Object.assign(new Error("ایمیل Google دریافت نشد"), { statusCode: 401 });
  }
  const email = payload.email.toLowerCase();
  if (!domainAllowed(email, cfg.allowedDomains || ["*"])) {
    await writeAuthAudit({
      req: params.req,
      organizationId,
      provider: "google",
      action: "login_failed",
      success: false,
      metadata: { email, reason: "domain" },
    });
    throw Object.assign(new Error("دامنه ایمیل مجاز نیست"), { statusCode: 403 });
  }

  await query("DELETE FROM oauth_states WHERE state = $1", [params.state]);

  let user = null;
  const existingIdentity = await findIdentity(organizationId, "google", payload.sub);
  if (existingIdentity) {
    user = await store.getUserById(String(existingIdentity.user_id));
  }
  if (!user) {
    user = await store.findUserByEmail(email);
    if (user && user.organizationId !== organizationId) {
      throw Object.assign(new Error("ایمیل به سازمان دیگری تعلق دارد"), { statusCode: 409 });
    }
  }

  let isNewUser = false;
  if (!user) {
    if (!cfg.autoProvision) {
      throw Object.assign(new Error("ایجاد خودکار حساب غیرفعال است"), { statusCode: 403 });
    }
    isNewUser = true;
    const nameParts = (payload.name || email.split("@")[0]).split(" ");
    user = await provisionUser({
      organizationId,
      email,
      firstName: nameParts[0] || "کاربر",
      lastName: nameParts.slice(1).join(" ") || "",
      role: cfg.defaultRole || "EMPLOYEE",
      provider: "google",
      providerUserId: payload.sub,
      metadata: { picture: payload.picture, emailVerified: payload.email_verified },
    });
  } else {
    await provisionUser({
      organizationId,
      email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      provider: "google",
      providerUserId: payload.sub,
      metadata: { picture: payload.picture },
    });
  }

  const session = await issueSessionForUser(user, isNewUser ? "حساب Google ایجاد شد" : undefined);
  session.isNewUser = isNewUser;
  (session.user as Record<string, unknown>).avatar = payload.picture;
  (session.user as Record<string, unknown>).avatarType = "google";

  await writeAuthAudit({
    req: params.req,
    userId: user.id,
    organizationId,
    provider: "google",
    action: "oauth_callback",
    success: true,
  });

  return {
    session,
    redirectAfter: row.redirect_after ? String(row.redirect_after) : null,
  };
}

export function buildOAuthCallbackHtml(
  token: string,
  redirectAfter: string | null,
  userJson?: Record<string, unknown>,
): string {
  const target = redirectAfter || "/";
  const hash = createHash("sha256").update(token).digest("hex").slice(0, 16);
  const userScript = userJson
    ? `localStorage.setItem('rooomchi_auth_user', ${JSON.stringify(JSON.stringify(userJson))});`
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Rooomchi</title></head>
<body><script>
localStorage.setItem('rooomchi_auth_token', ${JSON.stringify(token)});
localStorage.setItem('rooomchi_oauth_nonce', ${JSON.stringify(hash)});
${userScript}
window.location.replace(${JSON.stringify(target)});
</script></body></html>`;
}
