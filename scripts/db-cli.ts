#!/usr/bin/env tsx
/**
 * Rooomchi database CLI — schema extensions, reference seed, demo users.
 *
 * Usage:
 *   npm run db:sync              # full sync (default)
 *   npm run db:seed              # demo users only (+ schema extensions)
 *   npm run db:schema            # extensions only
 *   npm run db:status            # connection + row counts
 *   npm run db:sync -- --force-users
 */
import "dotenv/config";
import { getDbPool } from "../src/services/dbService";
import { checkDbStatus } from "../src/services/dbService";
import {
  printDatabaseCounts,
  seedDevUsers,
  seedReferenceData,
  syncDatabase,
} from "../src/server/persistence/seed";
import { ensureServerSchema } from "../src/server/persistence/store";
import { DbNotConfiguredError } from "../src/server/persistence/db";

const HELP = `
Rooomchi DB CLI

Commands:
  sync     Schema extensions + demo users (default; no sample rooms/orgs)
  seed     Schema extensions + demo users (admin@rooomchi.ir, …)
  schema   Only schema/02-server-extensions.sql
  data     Only schema/idempotent-seed.sql (orgs, rooms, teams, …)
  status   Connection test and table row counts

Options:
  --force-users   Retry demo user inserts even if user-super exists
  --reference     Load demo orgs/rooms/teams (schema/idempotent-seed.sql)
  --no-reference  Skip reference seed (default for sync)
  --no-demo       Skip demo users (sync only)
  --help          Show this help

Examples:
  npm run db:sync
  npm run db:seed -- --force-users
  npm run db:up && npm run db:sync
`.trim();

function parseArgs(argv: string[]) {
  const flags = new Set<string>();
  const positional: string[] = [];
  for (const a of argv) {
    if (a === "--help" || a === "-h") flags.add("help");
    else if (a.startsWith("--")) flags.add(a.slice(2));
    else positional.push(a);
  }
  return { cmd: positional[0] || "sync", flags };
}

async function requirePool() {
  const pool = getDbPool();
  if (!pool) {
    console.error("❌ PostgreSQL is not configured. Set DATABASE_URL or DB_* in .env");
    console.error("   Example: npm run db:up && cp .env.example .env");
    process.exit(1);
  }
  try {
    await pool.query("SELECT 1");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Cannot connect to PostgreSQL:", message);
    console.error("   Is Docker running? Try: npm run db:up");
    process.exit(1);
  }
  return pool;
}

async function main() {
  const { cmd, flags } = parseArgs(process.argv.slice(2));

  if (flags.has("help")) {
    console.log(HELP);
    return;
  }

  const pool = await requirePool();

  try {
    switch (cmd) {
      case "status": {
        const status = await checkDbStatus();
        console.log(status.connected ? "✅ Connected" : "❌ Not connected");
        console.log(`   Database: ${status.database ?? "—"}`);
        if (status.message) console.log(`   ${status.message}`);
        if (status.tableCounts) {
          for (const [k, v] of Object.entries(status.tableCounts)) {
            console.log(`   ${k}: ${v}`);
          }
        }
        console.log("\nTable counts (extended):");
        await printDatabaseCounts();
        break;
      }
      case "schema": {
        await ensureServerSchema();
        console.log("✅ schema/02-server-extensions.sql applied.");
        break;
      }
      case "data": {
        await seedReferenceData();
        break;
      }
      case "seed": {
        await ensureServerSchema();
        if (flags.has("reference")) {
          await seedReferenceData();
        }
        await seedDevUsers({ force: flags.has("force-users") });
        break;
      }
      case "sync":
      default: {
        await syncDatabase({
          schema: true,
          reference: flags.has("reference"),
          demoUsers: !flags.has("no-demo"),
          forceDemoUsers: flags.has("force-users"),
        });
        console.log("\nRow counts:");
        await printDatabaseCounts();
        break;
      }
    }
  } catch (err: unknown) {
    if (err instanceof DbNotConfiguredError) {
      console.error("❌ Database not configured.");
      process.exit(1);
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌", message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
