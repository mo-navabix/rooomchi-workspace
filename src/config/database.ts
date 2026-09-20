/** Shared PostgreSQL env detection (Express + Nest TypeORM). */
export function isDatabaseConfigured(): boolean {
  return !!(
    process.env.DATABASE_URL?.trim() ||
    process.env.DATABASE_HOST?.trim() ||
    process.env.DB_HOST?.trim() ||
    process.env.PGHOST?.trim()
  );
}

export function isDatabaseSslEnabled(): boolean {
  return (
    process.env.DATABASE_SSL === 'true' ||
    process.env.DB_SSL === 'true' ||
    process.env.PGSSL === 'true'
  );
}

export function getDatabaseSsl(): false | { rejectUnauthorized: false } {
  return isDatabaseSslEnabled() ? { rejectUnauthorized: false } : false;
}
