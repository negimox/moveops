/**
 * lib/db.ts
 * PostgreSQL connection pool using node-postgres (pg).
 *
 * WHY a pool? A single connection blocks; a pool allows multiple simultaneous
 * queries without opening a new TCP connection on every request — critical
 * for Next.js serverless-style route handlers which can fire concurrently.
 *
 * We export a single `pool` instance. Importing this module multiple times in
 * a Next.js dev-mode reload creates multiple pools, so we attach it to the
 * global object to avoid exhausting connections during hot-reload.
 */

import { Pool, QueryResultRow } from 'pg'

// Extend the NodeJS global to hold our pool between hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined
}

function createPool(): Pool {
  // Remove all query params (like ?sslmode=require) so they don't override the explicit ssl object below
  const connectionString = process.env.DATABASE_URL?.split('?')[0]

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Add it to .env.local — see .env.local for the format.'
    )
  }

  return new Pool({
    connectionString,
    max: 10,           // maximum number of clients in the pool
    idleTimeoutMillis: 30_000,  // close idle clients after 30 s
    connectionTimeoutMillis: 5_000, // fail fast if DB is unreachable
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false } // Change based on prod security needs
      : { rejectUnauthorized: false }, // Dev: bypass self-signed cert issues (e.g. AWS RDS)
  })
}

// In development, reuse across hot-reloads. In production, always fresh.
export const pool: Pool =
  process.env.NODE_ENV === 'production'
    ? createPool()
    : (globalThis._pgPool ??= createPool())

/**
 * Convenience helper — run a single parameterised query.
 *
 * Usage:
 *   const { rows } = await query('SELECT * FROM users WHERE id = $1', [userId])
 */
export async function query<T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
) {
  const start = Date.now()
  const result = await pool.query<T>(text, params)
  const duration = Date.now() - start

  if (process.env.NODE_ENV !== 'production') {
    console.log('[DB]', { text: text.slice(0, 80), duration, rows: result.rowCount })
  }

  return result
}
