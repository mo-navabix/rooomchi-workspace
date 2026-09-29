import { query } from "../persistence/db";
import { getAppVersionInfo } from "./version";

export type MigrationInfo = {
  name: string;
  appliedAt: string;
};

export async function listAppliedMigrations(): Promise<MigrationInfo[]> {
  try {
    const { rows } = await query<{ name: string; applied_at: Date }>(
      `SELECT name, applied_at FROM schema_migrations ORDER BY applied_at ASC`,
    );
    return rows.map((r) => ({
      name: r.name,
      appliedAt: new Date(r.applied_at).toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function getUpdateManagementSnapshot() {
  const app = getAppVersionInfo();
  const migrations = await listAppliedMigrations();
  return {
    currentVersion: app.version,
    applicationName: app.name,
    migrationsApplied: migrations.length,
    latestMigration: migrations[migrations.length - 1]?.name ?? null,
    /** Placeholder until release channel is wired — compare with packaged manifest in Phase 4 */
    availableUpdate: null as string | null,
  };
}
