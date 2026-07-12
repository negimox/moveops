import { Pool, type QueryResultRow } from 'pg';

if (!process.env.DATABASE_URL) {
  console.warn('[DB] DATABASE_URL is not set. Database queries will fail.');
}

// Singleton pool — Next.js hot-reload safe via global
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

const pool: Pool =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  global._pgPool = pool;
}

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

/**
 * Run a parameterized query against the PostgreSQL database.
 * Automatically initializes the vehicle_documents table on first use.
 */
export const query = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) => pool.query<T>(text, params);

export default pool;

/**
 * Bootstrap the vehicle_documents table if it doesn't exist yet.
 * Called from API routes on first request so no manual migration is needed.
 */
export async function ensureDocumentsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vehicle_documents (
      id          SERIAL PRIMARY KEY,
      vehicle_id  VARCHAR(50)  NOT NULL,
      doc_name    VARCHAR(255) NOT NULL,
      doc_type    VARCHAR(100) NOT NULL DEFAULT 'Other',
      ref_number  VARCHAR(255),
      expiry_date DATE,
      notes       TEXT,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_vehicle_docs_vehicle_id
      ON vehicle_documents (vehicle_id);
  `);
}
