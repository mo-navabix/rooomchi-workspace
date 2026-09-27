import { randomUUID } from "crypto";
import { query } from "../persistence/db";
import type {
  AuthPolicies,
  GoogleConfiguration,
  LdapConfiguration,
  OrganizationAuthSettings,
} from "./types";

function parseJson<T extends Record<string, unknown>>(value: unknown, fallback: T): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...fallback, ...(value as T) };
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as T;
      return { ...fallback, ...parsed };
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function mapRow(row: Record<string, unknown>): OrganizationAuthSettings {
  const legacyProvider = String(row.provider || "LOCAL").toUpperCase();
  const legacyEnabled = row.enabled === true || row.enabled === "t";
  const googleFromLegacy =
    legacyEnabled && (legacyProvider.includes("GOOGLE") || legacyProvider === "GOOGLE_WORKSPACE");

  return {
    organizationId: String(row.organization_id),
    localEnabled: row.local_enabled !== false && row.local_enabled !== "f",
    ldapEnabled: row.ldap_enabled === true || row.ldap_enabled === "t",
    googleEnabled:
      row.google_enabled === true ||
      row.google_enabled === "t" ||
      googleFromLegacy,
    ldapConfiguration: parseJson<LdapConfiguration>(row.ldap_configuration, {}),
    googleConfiguration: parseJson<GoogleConfiguration>(row.google_configuration, {
      clientId: row.client_id ? String(row.client_id) : undefined,
      clientSecret: row.client_secret ? String(row.client_secret) : undefined,
      redirectUri: row.issuer_url ? String(row.issuer_url) : undefined,
    }),
    authPolicies: parseJson<AuthPolicies>(row.auth_policies, {
      selfRegistrationEnabled: true,
      emailVerificationRequired: false,
      defaultLocalRole: "EMPLOYEE",
    }),
  };
}

const DEFAULT_SETTINGS: Omit<OrganizationAuthSettings, "organizationId"> = {
  localEnabled: true,
  ldapEnabled: false,
  googleEnabled: false,
  ldapConfiguration: {},
  googleConfiguration: {},
  authPolicies: {
    selfRegistrationEnabled: true,
    emailVerificationRequired: false,
    defaultLocalRole: "EMPLOYEE",
  },
};

export async function getOrganizationAuthSettings(
  organizationId: string,
): Promise<OrganizationAuthSettings> {
  const { rows } = await query(
    "SELECT * FROM organization_auth_settings WHERE organization_id = $1 LIMIT 1",
    [organizationId],
  );
  if (!rows[0]) {
    return { organizationId, ...DEFAULT_SETTINGS };
  }
  return mapRow(rows[0] as Record<string, unknown>);
}

export async function upsertOrganizationAuthSettings(
  organizationId: string,
  patch: Partial<OrganizationAuthSettings>,
): Promise<OrganizationAuthSettings> {
  const current = await getOrganizationAuthSettings(organizationId);
  const merged: OrganizationAuthSettings = {
    ...current,
    ...patch,
    organizationId,
    ldapConfiguration: { ...current.ldapConfiguration, ...patch.ldapConfiguration },
    googleConfiguration: { ...current.googleConfiguration, ...patch.googleConfiguration },
    authPolicies: { ...current.authPolicies, ...patch.authPolicies },
  };

  const id = `auth-${organizationId}`;
  await query(
    `INSERT INTO organization_auth_settings (
      id, organization_id, provider, enabled,
      local_enabled, ldap_enabled, google_enabled,
      ldap_configuration, google_configuration, auth_policies,
      client_id, client_secret, issuer_url, updated_at
    ) VALUES ($1,$2,'LOCAL',true,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9,$10,$11,NOW())
    ON CONFLICT (organization_id) DO UPDATE SET
      local_enabled = EXCLUDED.local_enabled,
      ldap_enabled = EXCLUDED.ldap_enabled,
      google_enabled = EXCLUDED.google_enabled,
      ldap_configuration = EXCLUDED.ldap_configuration,
      google_configuration = EXCLUDED.google_configuration,
      auth_policies = EXCLUDED.auth_policies,
      client_id = EXCLUDED.client_id,
      client_secret = EXCLUDED.client_secret,
      issuer_url = EXCLUDED.issuer_url,
      updated_at = NOW()`,
    [
      id,
      organizationId,
      merged.localEnabled,
      merged.ldapEnabled,
      merged.googleEnabled,
      JSON.stringify(merged.ldapConfiguration),
      JSON.stringify(merged.googleConfiguration),
      JSON.stringify(merged.authPolicies),
      merged.googleConfiguration.clientId || null,
      merged.googleConfiguration.clientSecret || null,
      merged.googleConfiguration.redirectUri || null,
    ],
  );
  return getOrganizationAuthSettings(organizationId);
}

export function publicAuthSettingsView(settings: OrganizationAuthSettings) {
  return {
    organizationId: settings.organizationId,
    localEnabled: settings.localEnabled,
    ldapEnabled: settings.ldapEnabled,
    googleEnabled: settings.googleEnabled,
    authPolicies: {
      selfRegistrationEnabled: settings.authPolicies.selfRegistrationEnabled !== false,
      emailVerificationRequired: settings.authPolicies.emailVerificationRequired === true,
    },
    ldap: settings.ldapEnabled
      ? { label: "ورود با حساب سازمانی (LDAP/Active Directory)" }
      : null,
    google: settings.googleEnabled
      ? {
          clientId:
            settings.googleConfiguration.clientId || process.env.GOOGLE_CLIENT_ID || null,
        }
      : null,
  };
}

export async function listLdapGroupRoleMappings(organizationId: string) {
  const { rows } = await query<{ ldap_group: string; role: string }>(
    "SELECT ldap_group, role FROM ldap_group_role_mappings WHERE organization_id = $1",
    [organizationId],
  );
  return rows.map((r) => ({ ldapGroup: r.ldap_group, role: r.role }));
}

export async function replaceLdapGroupRoleMappings(
  organizationId: string,
  mappings: { ldapGroup: string; role: string }[],
): Promise<void> {
  await query("DELETE FROM ldap_group_role_mappings WHERE organization_id = $1", [organizationId]);
  for (const m of mappings) {
    await query(
      `INSERT INTO ldap_group_role_mappings (id, organization_id, ldap_group, role)
       VALUES ($1,$2,$3,$4)`,
      [`lgr-${randomUUID()}`, organizationId, m.ldapGroup, m.role],
    );
  }
}
