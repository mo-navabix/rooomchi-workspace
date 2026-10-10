import { Client } from "ldapts";
import type { LdapConfiguration } from "./types";

/** Shown in admin UI when bind password is stored but hidden. */
export const LDAP_BIND_PASSWORD_MASK = "••••••••";

export function mergeLdapConfiguration(
  current: LdapConfiguration,
  patch: LdapConfiguration,
): LdapConfiguration {
  const merged: LdapConfiguration = { ...current, ...patch };
  const patchPwd = patch.bindPassword?.trim();
  if (!patchPwd || patchPwd === LDAP_BIND_PASSWORD_MASK) {
    merged.bindPassword = current.bindPassword;
  }
  return merged;
}

export function createLdapClient(url: string, useTls?: boolean): Client {
  const normalizedUrl = url.trim();
  const isLdaps = normalizedUrl.toLowerCase().startsWith("ldaps://");
  const tls = useTls === true || isLdaps;
  return new Client({
    url: normalizedUrl,
    tlsOptions: tls ? { rejectUnauthorized: false } : undefined,
  });
}
