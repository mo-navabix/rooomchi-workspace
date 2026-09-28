import { Client } from "ldapts";
import type { Request } from "express";
import type { Organization } from "../../types";
import { writeAuthAudit } from "../audit.service";
import { issueSessionForUser } from "../session.service";
import type { LdapConfiguration, OrganizationAuthSettings } from "../types";
import { provisionUser } from "../identity.store";
import { listLdapGroupRoleMappings } from "../auth-settings.store";
import { toApiRole } from "../../persistence/mappers";
import { decryptSecret } from "../../security/secret-crypto";

function resolveLdapConfig(settings: OrganizationAuthSettings): LdapConfiguration {
  const c = settings.ldapConfiguration;
  const bindPassword = c.bindPassword
    ? decryptSecret(c.bindPassword)
    : process.env.LDAP_BIND_PASSWORD;
  return {
    url: c.url || process.env.LDAP_URL,
    bindDn: c.bindDn || process.env.LDAP_BIND_DN,
    bindPassword,
    baseDn: c.baseDn || process.env.LDAP_BASE_DN,
    userFilter:
      c.userFilter ||
      process.env.LDAP_USER_FILTER ||
      "(|(sAMAccountName={username})(userPrincipalName={username})(mail={username}))",
    emailAttribute: c.emailAttribute || process.env.LDAP_EMAIL_ATTRIBUTE || "mail",
    nameAttribute: c.nameAttribute || process.env.LDAP_NAME_ATTRIBUTE || "displayName",
    defaultRole: c.defaultRole || "EMPLOYEE",
    useTls: c.useTls ?? process.env.LDAP_USE_TLS === "true",
  };
}

function escapeLdapFilter(value: string): string {
  return value.replace(/[\\*()\0]/g, (ch) => `\\${ch}`);
}

async function mapLdapRole(organizationId: string, memberOf: string[], defaultRole: string): Promise<string> {
  const mappings = await listLdapGroupRoleMappings(organizationId);
  for (const m of mappings) {
    const key = m.ldapGroup.toLowerCase();
    if (memberOf.some((g) => g.toLowerCase().includes(key))) {
      return toApiRole(m.role);
    }
  }
  return toApiRole(defaultRole);
}

export async function ldapLogin(params: {
  req: Request;
  organization: Organization;
  settings: OrganizationAuthSettings;
  username: string;
  password: string;
}) {
  const { req, organization, settings, username, password } = params;
  if (!settings.ldapEnabled) {
    throw Object.assign(new Error("ورود LDAP برای این سازمان فعال نیست"), { statusCode: 403 });
  }

  const cfg = resolveLdapConfig(settings);
  if (!cfg.url || !cfg.baseDn) {
    throw Object.assign(new Error("پیکربندی LDAP سازمان ناقص است"), { statusCode: 500 });
  }

  const client = new Client({ url: cfg.url, tlsOptions: cfg.useTls ? { rejectUnauthorized: false } : undefined });
  const safeUser = escapeLdapFilter(username.trim());
  const filter = cfg.userFilter!.replace(/\{username\}/g, safeUser);

  try {
    if (cfg.bindDn && cfg.bindPassword) {
      await client.bind(cfg.bindDn, cfg.bindPassword);
    }

    const { searchEntries } = await client.search(cfg.baseDn, {
      scope: "sub",
      filter,
      attributes: [
        "dn",
        "sAMAccountName",
        "userPrincipalName",
        "mail",
        "displayName",
        "memberOf",
        "cn",
      ],
    });

    if (!searchEntries.length) {
      await writeAuthAudit({
        req,
        organizationId: organization.id,
        provider: "ldap",
        action: "login_failed",
        success: false,
        metadata: { username },
      });
      throw Object.assign(new Error("کاربر در دایرکتوری سازمان یافت نشد"), { statusCode: 401 });
    }

    const entry = searchEntries[0];
    const userDn = String(entry.dn);
    await client.bind(userDn, password);

    const emailAttr = cfg.emailAttribute!;
    const emailRaw =
      entry[emailAttr] ||
      entry.mail ||
      entry.userPrincipalName ||
      (username.includes("@") ? username : `${username}@${organization.domain || "local"}`);
    const email = String(Array.isArray(emailRaw) ? emailRaw[0] : emailRaw).toLowerCase();

    const nameRaw = entry[cfg.nameAttribute!] || entry.displayName || entry.cn || username;
    const displayName = String(Array.isArray(nameRaw) ? nameRaw[0] : nameRaw);
    const parts = displayName.split(" ");
    const firstName = parts[0] || displayName;
    const lastName = parts.slice(1).join(" ") || "";

    const memberOfRaw = entry.memberOf;
    const memberOf = Array.isArray(memberOfRaw)
      ? memberOfRaw.map(String)
      : memberOfRaw
        ? [String(memberOfRaw)]
        : [];

    const providerUserId =
      String(entry.sAMAccountName || entry.userPrincipalName || userDn).toLowerCase();
    const role = await mapLdapRole(organization.id, memberOf, cfg.defaultRole || "EMPLOYEE");

    const user = await provisionUser({
      organizationId: organization.id,
      email,
      firstName,
      lastName,
      role,
      provider: "ldap",
      providerUserId,
      metadata: { dn: userDn, memberOf },
    });

    const session = await issueSessionForUser(user);
    await writeAuthAudit({
      req,
      userId: user.id,
      organizationId: organization.id,
      provider: "ldap",
      action: "ldap_login",
      success: true,
    });
    return session;
  } catch (err: unknown) {
    const statusCode =
      err && typeof err === "object" && "statusCode" in err
        ? Number((err as { statusCode: number }).statusCode)
        : 401;
    if (statusCode === 401) {
      await writeAuthAudit({
        req,
        organizationId: organization.id,
        provider: "ldap",
        action: "login_failed",
        success: false,
        metadata: { username },
      });
    }
    if (err instanceof Error && "statusCode" in err) throw err;
    throw Object.assign(new Error("احراز هویت LDAP ناموفق بود"), { statusCode: 401 });
  } finally {
    await client.unbind().catch(() => undefined);
  }
}

export async function testLdapUserLookup(
  config: LdapConfiguration,
  username: string,
): Promise<{ ok: boolean; message: string; preview?: { email?: string; name?: string } }> {
  const cfg = {
    url: config.url,
    bindDn: config.bindDn,
    bindPassword: config.bindPassword ? decryptSecret(config.bindPassword) : config.bindPassword,
    baseDn: config.baseDn,
    userFilter: config.userFilter,
    useTls: config.useTls,
  };
  if (!cfg.url || !cfg.baseDn || !username.trim()) {
    return { ok: false, message: "URL، Base DN و نام کاربر الزامی است." };
  }
  const client = new Client({
    url: cfg.url,
    tlsOptions: cfg.useTls ? { rejectUnauthorized: false } : undefined,
  });
  const safeUser = escapeLdapFilter(username.trim());
  const filter = (cfg.userFilter || "(mail={username})").replace(/\{username\}/g, safeUser);
  try {
    if (cfg.bindDn && cfg.bindPassword) await client.bind(cfg.bindDn, cfg.bindPassword);
    const { searchEntries } = await client.search(cfg.baseDn, {
      scope: "sub",
      filter,
      sizeLimit: 1,
      attributes: ["mail", "displayName", "cn"],
    });
    if (!searchEntries.length) return { ok: false, message: "کاربری با این مشخصات یافت نشد." };
    const e = searchEntries[0];
    const mail = e.mail ? String(Array.isArray(e.mail) ? e.mail[0] : e.mail) : undefined;
    const name = e.displayName
      ? String(Array.isArray(e.displayName) ? e.displayName[0] : e.displayName)
      : e.cn
        ? String(Array.isArray(e.cn) ? e.cn[0] : e.cn)
        : undefined;
    return { ok: true, message: "کاربر در LDAP پیدا شد.", preview: { email: mail, name } };
  } catch (err: unknown) {
    return { ok: false, message: err instanceof Error ? err.message : "خطا در جستجو" };
  } finally {
    await client.unbind().catch(() => undefined);
  }
}

export async function testLdapConnection(
  config: LdapConfiguration,
): Promise<{ ok: boolean; message: string }> {
  const cfg = {
    url: config.url,
    bindDn: config.bindDn,
    bindPassword: config.bindPassword ? decryptSecret(config.bindPassword) : config.bindPassword,
    baseDn: config.baseDn,
    useTls: config.useTls,
  };
  if (!cfg.url || !cfg.baseDn) {
    return { ok: false, message: "آدرس سرور LDAP و Base DN الزامی است." };
  }
  const client = new Client({
    url: cfg.url,
    tlsOptions: cfg.useTls ? { rejectUnauthorized: false } : undefined,
  });
  try {
    if (cfg.bindDn && cfg.bindPassword) {
      await client.bind(cfg.bindDn, cfg.bindPassword);
    }
    await client.search(cfg.baseDn, { scope: "base", filter: "(objectClass=*)", sizeLimit: 1 });
    return { ok: true, message: "اتصال LDAP با موفقیت برقرار شد." };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطای اتصال LDAP";
    return { ok: false, message };
  } finally {
    await client.unbind().catch(() => undefined);
  }
}
