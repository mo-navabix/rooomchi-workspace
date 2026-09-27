#!/usr/bin/env tsx
import "dotenv/config";
import { getDbPool } from "../src/services/dbService";
import { ensureDemoLoginPasswords } from "../src/server/persistence/seed";

async function main() {
  if (!getDbPool()) {
    console.error("PostgreSQL not configured.");
    process.exit(1);
  }
  await ensureDemoLoginPasswords();
  const pool = getDbPool();
  await pool?.end();
}

main();
