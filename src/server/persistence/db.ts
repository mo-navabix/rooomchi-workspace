import type { QueryResult } from "pg";
import { getDbPool } from "../../services/dbService";

export class DbNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_NOT_CONFIGURED");
    this.name = "DbNotConfiguredError";
  }
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  const pool = getDbPool();
  if (!pool) throw new DbNotConfiguredError();
  return pool.query<T>(text, params);
}
