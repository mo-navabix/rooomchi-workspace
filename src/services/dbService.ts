import pg from 'pg';
import { getDatabaseSsl } from '../config/database';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let isConnected = false;
let lastError: string | null = null;

export function getDbPool(): pg.Pool | null {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  const host =
    process.env.DB_HOST ||
    process.env.DATABASE_HOST ||
    process.env.PGHOST;
  const database =
    process.env.DB_DATABASE ||
    process.env.DATABASE_NAME ||
    process.env.DB_NAME ||
    process.env.PGDATABASE;
  const user =
    process.env.DB_USERNAME ||
    process.env.DATABASE_USER ||
    process.env.DB_USER ||
    process.env.PGUSER;
  const password =
    process.env.DB_PASSWORD ||
    process.env.DATABASE_PASSWORD ||
    process.env.PGPASSWORD;
  const port = Number(process.env.DB_PORT || process.env.PGPORT) || 5432;

  // Only initialize if connection config is provided
  if (!connectionString && !host && !database) {
    return null;
  }

  try {
    const ssl = getDatabaseSsl();
    pool = connectionString
      ? new Pool({ connectionString, ...(ssl ? { ssl } : {}) })
      : new Pool({
          host: host || 'localhost',
          port,
          database: database || 'didar_db',
          user: user || 'postgres',
          password: password || '',
          ...(ssl ? { ssl } : {}),
        });

    pool.on('error', (err) => {
      console.warn('PostgreSQL Pool Error:', err.message);
      isConnected = false;
      lastError = err.message;
    });

    // Test connection asynchronously
    pool.query('SELECT NOW()')
      .then(() => {
        isConnected = true;
        lastError = null;
        console.log('✅ Connected to PostgreSQL database (didar_db) successfully.');
      })
      .catch((err) => {
        isConnected = false;
        lastError = err.message;
        console.warn('⚠️ Could not connect to PostgreSQL:', err.message);
      });

    return pool;
  } catch (err: any) {
    lastError = err.message;
    return null;
  }
}

export async function checkDbStatus() {
  const currentPool = getDbPool();
  if (!currentPool) {
    return {
      configured: false,
      connected: false,
      message: 'تنظیمات دیتابیس PostgreSQL پیکربندی نشده است (DATABASE_URL تنظیم نشده است).',
      host: process.env.PGHOST || 'localhost',
      database: process.env.PGDATABASE || 'didar_db',
    };
  }

  try {
    const result = await currentPool.query('SELECT current_database(), version(), NOW()');
    isConnected = true;
    lastError = null;
    return {
      configured: true,
      connected: true,
      database: result.rows[0]?.current_database || 'didar_db',
      version: result.rows[0]?.version,
      timestamp: result.rows[0]?.now,
      message: 'اتصال به PostgreSQL با موفقیت برقرار است.',
    };
  } catch (err: any) {
    isConnected = false;
    lastError = err.message;
    return {
      configured: true,
      connected: false,
      error: err.message,
      message: `خطا در اتصال به دیتابیس: ${err.message}`,
    };
  }
}
