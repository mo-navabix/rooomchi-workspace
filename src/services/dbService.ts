import pg from "pg";
import { getDatabaseSsl } from "../config/database";

const { Pool, types } = pg;

// Keep SQL `date` as YYYY-MM-DD strings (avoid Date → toISOString() shifting the day in UTC+3:30).
types.setTypeParser(1082, (val: string) => val);

let pool: pg.Pool | null = null;
let isConnected = false;
let lastError: string | null = null;

export function getDbPool(): pg.Pool | null {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  const host =
    process.env.DB_HOST || process.env.DATABASE_HOST || process.env.PGHOST;
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
          host: host || "localhost",
          port,
          database: database || "rooomchi_db",
          user: user || "postgres",
          password: password || "",
          ...(ssl ? { ssl } : {}),
        });

    pool.on("error", (err) => {
      console.warn("PostgreSQL Pool Error:", err.message);
      isConnected = false;
      lastError = err.message;
    });

    // Test connection asynchronously
    pool
      .query("SELECT NOW()")
      .then(() => {
        isConnected = true;
        lastError = null;
        console.log(
          "✅ Connected to PostgreSQL database (rooomchi_db) successfully.",
        );
      })
      .catch((err) => {
        isConnected = false;
        lastError = err.message;
        console.warn("⚠️ Could not connect to PostgreSQL:", err.message);
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
      message:
        "تنظیمات دیتابیس PostgreSQL پیکربندی نشده است (DATABASE_URL تنظیم نشده است).",
      host: process.env.PGHOST || "localhost",
      database: process.env.PGDATABASE || "rooomchi_db",
    };
  }

  try {
    const result = await currentPool.query(
      "SELECT current_database(), version(), NOW()",
    );
    let tableCounts: Record<string, number> | undefined;
    try {
      const counts = await currentPool.query<{
        table_name: string;
        c: string;
      }>(`
        SELECT 'rooms' AS table_name, COUNT(*)::text AS c FROM rooms
        UNION ALL SELECT 'bookings', COUNT(*)::text FROM bookings
        UNION ALL SELECT 'users', COUNT(*)::text FROM users
      `);
      tableCounts = {};
      for (const row of counts.rows) {
        tableCounts[row.table_name] = Number(row.c);
      }
    } catch {
      tableCounts = undefined;
    }
    isConnected = true;
    lastError = null;
    return {
      configured: true,
      connected: true,
      database: result.rows[0]?.current_database || "rooomchi_db",
      version: result.rows[0]?.version,
      timestamp: result.rows[0]?.now,
      tableCounts,
      message: "اتصال به PostgreSQL با موفقیت برقرار است.",
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
