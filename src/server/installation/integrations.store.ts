import { randomUUID } from "crypto";
import { query } from "../persistence/db";
import { decryptConfigSecrets, encryptConfigSecrets } from "../security/secret-crypto";

export type IntegrationProvider = "smtp" | "storage" | "resend" | "sms" | "telegram";

const SECRET_KEYS: Record<IntegrationProvider, string[]> = {
  smtp: ["password"],
  storage: [],
  resend: ["apiKey"],
  sms: ["apiKey"],
  telegram: ["botToken"],
};

export async function upsertIntegration(
  organizationId: string,
  provider: IntegrationProvider,
  config: Record<string, unknown>,
  enabled = true,
): Promise<void> {
  const encrypted = encryptConfigSecrets(config, SECRET_KEYS[provider]);
  const id = `int-${provider}-${organizationId}`;
  await query(
    `INSERT INTO integrations (id, organization_id, provider, enabled, config, updated_at)
     VALUES ($1,$2,$3,$4,$5::jsonb,NOW())
     ON CONFLICT (organization_id, provider) DO UPDATE SET
       enabled = EXCLUDED.enabled,
       config = EXCLUDED.config,
       updated_at = NOW()`,
    [id, organizationId, provider, enabled, JSON.stringify(encrypted)],
  );
}

export async function getIntegration(
  organizationId: string,
  provider: IntegrationProvider,
): Promise<{ enabled: boolean; config: Record<string, unknown> } | null> {
  const { rows } = await query(
    `SELECT enabled, config FROM integrations WHERE organization_id = $1 AND provider = $2 LIMIT 1`,
    [organizationId, provider],
  );
  if (!rows[0]) return null;
  const raw = (rows[0].config as Record<string, unknown>) || {};
  return {
    enabled: rows[0].enabled === true || rows[0].enabled === "t",
    config: decryptConfigSecrets(raw, SECRET_KEYS[provider]),
  };
}

export async function listIntegrations(organizationId: string) {
  const { rows } = await query(
    `SELECT provider, enabled, config FROM integrations WHERE organization_id = $1`,
    [organizationId],
  );
  return rows.map((row) => {
    const provider = String(row.provider) as IntegrationProvider;
    const raw = (row.config as Record<string, unknown>) || {};
    return {
      provider,
      enabled: row.enabled === true || row.enabled === "t",
      config: decryptConfigSecrets(raw, SECRET_KEYS[provider] || []),
    };
  });
}
