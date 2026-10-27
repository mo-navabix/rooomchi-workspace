#!/usr/bin/env tsx
/**
 * Applies SQL migrations in order and records them in schema_migrations.
 *
 * Order:
 *   1. schema.sql (base)
 *   2. schema/02-server-extensions.sql
 *   3. database/migrations/*.sql (sorted by filename)
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { getDbPool } from "../src/services/dbService";
import { runSqlFile } from "../src/server/persistence/sql-runner";
import { query } from "../src/server/persistence/db";
import { logger } from "../src/server/logger";

const CORE_MIGRATIONS = [
  "schema.sql",
  "schema/02-server-extensions.sql",
  "schema/03-installation-setup.sql",
  "schema/04-admin-settings.sql",
  "schema/05-user-notifications.sql",
  "schema/06-org-logo-text.sql",
  "schema/07-campus-hierarchy.sql",
  "schema/07-support-tickets-and-notifications.sql",
  "schema/08-verification-org.sql",
];

async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(512) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function isApplied(name: string): Promise<boolean> {
  const { rows } = await query<{ c: string }>(
    "SELECT COUNT(*)::text AS c FROM schema_migrations WHERE name = $1",
    [name],
  );
  return Number(rows[0]?.c) > 0;
}

async function markApplied(name: string): Promise<void> {
  await query("INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING", [
    name,
  ]);
}

function listExtraMigrations(): string[] {
  const dir = path.join(process.cwd(), "database", "migrations");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => path.join("database", "migrations", f).replace(/\\/g, "/"));
}

async function baseSchemaPresent(): Promise<boolean> {
  const { rows } = await query<{ t: string | null }>(
    "SELECT to_regclass('public.users')::text AS t",
  );
  return Boolean(rows[0]?.t);
}

async function applyMigration(name: string): Promise<void> {
  if (await isApplied(name)) {
    logger.info({ migration: name }, "migration_skip");
    return;
  }
  if (name === "schema.sql" && (await baseSchemaPresent())) {
    logger.info({ migration: name }, "migration_skip_existing_db");
    await markApplied(name);
    return;
  }
  logger.info({ migration: name }, "migration_apply");
  await runSqlFile(name);
  await markApplied(name);
  logger.info({ migration: name }, "migration_done");
}

async function main(): Promise<void> {
  const pool = getDbPool();
  if (!pool) {
    console.error("PostgreSQL is not configured. Set DATABASE_URL or DB_*.");
    process.exit(1);
  }
  await pool.query("SELECT 1");
  await ensureMigrationsTable();

  const all = [...CORE_MIGRATIONS, ...listExtraMigrations()];
  for (const name of all) {
    await applyMigration(name);
  }
  logger.info({ count: all.length }, "migrations_complete");
  await pool.end();
}

main().catch((err) => {
  logger.error({ err }, "migration_failed");
  process.exit(1);
});
