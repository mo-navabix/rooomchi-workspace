import { query } from "../persistence/db";

export type InstallationStatus = {
  id: string;
  initialized: boolean;
  organizationCreated: boolean;
  adminCreated: boolean;
  completedAt: string | null;
  createdAt: string;
};

function mapRow(row: Record<string, unknown>): InstallationStatus {
  return {
    id: String(row.id),
    initialized: row.initialized === true || row.initialized === "t",
    organizationCreated: row.organization_created === true || row.organization_created === "t",
    adminCreated: row.admin_created === true || row.admin_created === "t",
    completedAt: row.completed_at ? String(row.completed_at) : null,
    createdAt: String(row.created_at),
  };
}

export async function ensureInstallationRow(): Promise<void> {
  await query(
    `INSERT INTO installation_status (id, initialized, organization_created, admin_created)
     VALUES ('default', false, false, false)
     ON CONFLICT (id) DO NOTHING`,
  );
}

export async function getInstallationStatus(): Promise<InstallationStatus> {
  await ensureInstallationRow();
  const { rows } = await query("SELECT * FROM installation_status WHERE id = 'default' LIMIT 1");
  return mapRow(rows[0] as Record<string, unknown>);
}

export async function isInstallationInitialized(): Promise<boolean> {
  const status = await getInstallationStatus();
  return status.initialized;
}

export async function markInstallationComplete(): Promise<void> {
  await query(
    `UPDATE installation_status SET
      initialized = true,
      organization_created = true,
      admin_created = true,
      completed_at = NOW(),
      updated_at = NOW()
     WHERE id = 'default'`,
  );
}

export async function markInstallationProgress(patch: {
  organizationCreated?: boolean;
  adminCreated?: boolean;
}): Promise<void> {
  if (patch.organizationCreated) {
    await query(
      `UPDATE installation_status SET organization_created = true, updated_at = NOW() WHERE id = 'default'`,
    );
  }
  if (patch.adminCreated) {
    await query(
      `UPDATE installation_status SET admin_created = true, updated_at = NOW() WHERE id = 'default'`,
    );
  }
}
