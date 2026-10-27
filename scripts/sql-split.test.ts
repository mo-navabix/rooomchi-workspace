import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { splitPostgresSql } from "../src/server/persistence/sql-split";

test("08-verification-org.sql: DO $$ block stays one statement", () => {
  const file = path.join(process.cwd(), "schema", "08-verification-org.sql");
  const sql = fs.readFileSync(file, "utf8");
  const parts = splitPostgresSql(sql);
  assert.equal(parts.length, 3);
  assert.match(parts[0], /ADD COLUMN IF NOT EXISTS organization_id/i);
  assert.match(parts[1], /^DO \$\$/);
  assert.match(parts[1], /END \$\$$/);
  assert.match(parts[2], /CREATE INDEX IF NOT EXISTS idx_verification_codes_org/i);
});

test("semicolons inside dollar quotes do not split", () => {
  const sql = `SELECT 1;
DO $$
BEGIN
  IF true THEN
    PERFORM 1;
  END IF;
END $$;
SELECT 2;`;
  const parts = splitPostgresSql(sql);
  assert.equal(parts.length, 3);
  assert.equal(parts[0], "SELECT 1");
  assert.match(parts[1], /DO \$\$/);
});
