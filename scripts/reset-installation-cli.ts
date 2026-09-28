#!/usr/bin/env tsx
/**
 * Reset self-hosted installation wizard state (DEV / QA only).
 * Wipes tenant data and marks installation as not initialized.
 *
 *   npm run setup:reset
 */
import "dotenv/config";
import { getDbPool } from "../src/services/dbService";
import { ensureServerSchema } from "../src/server/persistence/store";

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SETUP_RESET !== "true") {
    console.error("❌ setup:reset is blocked in production. Set ALLOW_SETUP_RESET=true to override.");
    process.exit(1);
  }

  const pool = getDbPool();
  if (!pool) {
    console.error("❌ DATABASE_URL / DB_* not configured.");
    process.exit(1);
  }

  await ensureServerSchema();

  console.log("⚠️  Resetting installation (all organizations, users, bookings will be removed)…");

  await pool.query(`
    TRUNCATE TABLE
      oauth_states,
      ldap_group_role_mappings,
      auth_audit_logs,
      user_external_identities,
      verification_codes,
      integrations,
      organization_auth_settings,
      team_members,
      teams,
      bookings,
      rooms,
      users,
      organizations
    RESTART IDENTITY CASCADE
  `);

  await pool.query(`
    UPDATE installation_status SET
      initialized = false,
      organization_created = false,
      admin_created = false,
      completed_at = NULL,
      updated_at = NOW()
    WHERE id = 'default'
  `);

  await pool.query(`
    INSERT INTO installation_status (id, initialized, organization_created, admin_created)
    VALUES ('default', false, false, false)
    ON CONFLICT (id) DO UPDATE SET
      initialized = false,
      organization_created = false,
      admin_created = false,
      completed_at = NULL,
      updated_at = NOW()
  `);

  console.log("✅ Installation reset. Next steps:");
  console.log("   1. npm run dev");
  console.log("   2. Clear site data / localStorage for localhost in the browser");
  console.log("   3. Open http://localhost:3000/setup");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
