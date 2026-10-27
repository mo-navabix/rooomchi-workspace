import fs from "fs";
import path from "path";
import type { PoolClient } from "pg";
import { query } from "./db";
import { splitPostgresSql } from "./sql-split";

export { splitPostgresSql } from "./sql-split";

export async function runSqlFile(
  relativePath: string,
  client?: PoolClient,
): Promise<number> {
  const filePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`SQL file not found: ${filePath}`);
  }
  const sql = fs.readFileSync(filePath, "utf8");
  const statements = splitPostgresSql(sql);
  const exec = client
    ? (text: string) => client.query(text)
    : (text: string) => query(text);

  for (const statement of statements) {
    await exec(`${statement};`);
  }
  return statements.length;
}
