import { query } from "../persistence/db";

export type SystemSettings = {
  organizationId: string;
  appUrl: string;
  defaultTimezone: string;
  maintenanceMode: boolean;
  sessionTimeoutMinutes: number;
  maxUploadMb: number;
  security: {
    passwordMinLength?: number;
    passwordRequireUppercase?: boolean;
    passwordRequireNumber?: boolean;
    passwordRequireSpecial?: boolean;
  };
};

const DEFAULTS: Omit<SystemSettings, "organizationId"> = {
  appUrl: process.env.APP_URL || "",
  defaultTimezone: "Asia/Tehran",
  maintenanceMode: false,
  sessionTimeoutMinutes: 60,
  maxUploadMb: 10,
  security: {
    passwordMinLength: 8,
    passwordRequireUppercase: false,
    passwordRequireNumber: true,
    passwordRequireSpecial: false,
  },
};

function mapRow(orgId: string, row: Record<string, unknown> | undefined): SystemSettings {
  const sec =
    row?.security && typeof row.security === "object"
      ? { ...DEFAULTS.security, ...(row.security as object) }
      : DEFAULTS.security;
  return {
    organizationId: orgId,
    appUrl: row?.app_url ? String(row.app_url) : DEFAULTS.appUrl,
    defaultTimezone: row?.default_timezone ? String(row.default_timezone) : DEFAULTS.defaultTimezone,
    maintenanceMode: row?.maintenance_mode === true || row?.maintenance_mode === "t",
    sessionTimeoutMinutes: Number(row?.session_timeout_minutes) || DEFAULTS.sessionTimeoutMinutes,
    maxUploadMb: Number(row?.max_upload_mb) || DEFAULTS.maxUploadMb,
    security: sec,
  };
}

export async function getSystemSettings(organizationId: string): Promise<SystemSettings> {
  const { rows } = await query(
    "SELECT * FROM system_settings WHERE organization_id = $1 LIMIT 1",
    [organizationId],
  );
  return mapRow(organizationId, rows[0] as Record<string, unknown> | undefined);
}

export async function upsertSystemSettings(
  organizationId: string,
  patch: Partial<SystemSettings>,
): Promise<SystemSettings> {
  const current = await getSystemSettings(organizationId);
  const merged: SystemSettings = {
    ...current,
    ...patch,
    organizationId,
    security: { ...current.security, ...patch.security },
  };
  await query(
    `INSERT INTO system_settings (
      organization_id, app_url, default_timezone, maintenance_mode,
      session_timeout_minutes, max_upload_mb, security, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,NOW())
    ON CONFLICT (organization_id) DO UPDATE SET
      app_url = EXCLUDED.app_url,
      default_timezone = EXCLUDED.default_timezone,
      maintenance_mode = EXCLUDED.maintenance_mode,
      session_timeout_minutes = EXCLUDED.session_timeout_minutes,
      max_upload_mb = EXCLUDED.max_upload_mb,
      security = EXCLUDED.security,
      updated_at = NOW()`,
    [
      organizationId,
      merged.appUrl || null,
      merged.defaultTimezone,
      merged.maintenanceMode,
      merged.sessionTimeoutMinutes,
      merged.maxUploadMb,
      JSON.stringify(merged.security),
    ],
  );
  return getSystemSettings(organizationId);
}
