import fs from "fs";
import path from "path";
import { query } from "./db";

/** Split SQL file into executable statements (skips empty lines and line comments). */
function splitSqlStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
}

export async function runSqlFile(relativePath: string): Promise<number> {
  const filePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`SQL file not found: ${filePath}`);
  }
  const sql = fs.readFileSync(filePath, "utf8");
  const statements = splitSqlStatements(sql);
  for (const statement of statements) {
    await query(`${statement};`);
  }
  return statements.length;
}
