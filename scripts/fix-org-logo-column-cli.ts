#!/usr/bin/env tsx
/**
 * One-time fix: organizations.logo must be TEXT for uploaded logos.
 *   npm run db:fix-logo
 */
import "dotenv/config";
import { ensureOrgLogoColumnIsText } from "../src/server/persistence/store";
import { getDbPool } from "../src/services/dbService";

async function main() {
  const pool = getDbPool();
  if (!pool) {
    console.error("❌ DATABASE_URL / DB_* not configured.");
    process.exit(1);
  }
  await ensureOrgLogoColumnIsText();
  console.log("✅ organizations.logo is TEXT — you can save uploaded logos now.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
