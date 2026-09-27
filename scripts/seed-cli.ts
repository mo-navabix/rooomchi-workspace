#!/usr/bin/env tsx
/**
 * Production/reference seed — does not insert demo users unless --demo is passed.
 */
import "dotenv/config";
import { getDbPool } from "../src/services/dbService";
import { seedReferenceData, seedDevUsers } from "../src/server/persistence/seed";
import { ensureServerSchema } from "../src/server/persistence/store";
import { logger } from "../src/server/logger";

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function main(): Promise<void> {
  const pool = getDbPool();
  if (!pool) {
    console.error("PostgreSQL is not configured.");
    process.exit(1);
  }
  await pool.query("SELECT 1");
  await ensureServerSchema();

  const seedDir = "database/seed";
  const fs = await import("fs");
  const path = await import("path");
  const dir = path.join(process.cwd(), seedDir);
  if (fs.existsSync(dir)) {
    const { runSqlFile } = await import("../src/server/persistence/sql-runner");
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const f of files) {
      const rel = `${seedDir}/${f}`;
      logger.info({ file: rel }, "seed_sql");
      await runSqlFile(rel);
    }
  } else {
    await seedReferenceData();
  }

  if (hasFlag("--demo") || hasFlag("--force-users")) {
    await seedDevUsers({ force: hasFlag("--force-users") });
  }

  logger.info("seed_complete");
  await pool.end();
}

main().catch((err) => {
  logger.error({ err }, "seed_failed");
  process.exit(1);
});
