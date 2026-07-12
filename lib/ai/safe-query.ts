/**
 * lib/ai/safe-query.ts
 * SQL safety layer — validates and executes read-only queries.
 *
 * This is the critical security boundary between the LLM and the database.
 * Even if Claude tries to generate a destructive query, this layer blocks it.
 */

import { pool } from '@/lib/db'

// Patterns that indicate a write/destructive operation
const FORBIDDEN_PATTERNS = [
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bDELETE\b/i,
  /\bDROP\b/i,
  /\bALTER\b/i,
  /\bTRUNCATE\b/i,
  /\bCREATE\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bEXECUTE\b/i,
  /\bCOPY\b/i,
  /\bIMPORT\b/i,
]

// Columns that should never be exposed
const SENSITIVE_COLUMNS = /password_hash|password/i

interface SafeQueryResult {
  success: boolean
  rows?: Record<string, unknown>[]
  rowCount?: number
  error?: string
}

/**
 * Validates a SQL query string for safety.
 * Returns null if safe, or an error message if blocked.
 */
function validateQuery(sql: string): string | null {
  const trimmed = sql.trim()

  // Must start with SELECT or WITH (for CTEs)
  if (!/^(SELECT|WITH)\b/i.test(trimmed)) {
    return 'Only SELECT queries are allowed. Query must start with SELECT or WITH.'
  }

  // Check for forbidden operations
  for (const pattern of FORBIDDEN_PATTERNS) {
    // Skip checking inside string literals — crude but effective
    // Remove string contents first, then check
    const withoutStrings = trimmed.replace(/'[^']*'/g, "''")
    if (pattern.test(withoutStrings)) {
      return `Blocked: query contains forbidden operation matching ${pattern.source}`
    }
  }

  // Check for multiple statements (semicolons that aren't in strings)
  const withoutStrings = trimmed.replace(/'[^']*'/g, "''")
  const semicolonCount = (withoutStrings.match(/;/g) || []).length
  if (semicolonCount > 1) {
    return 'Multiple SQL statements are not allowed.'
  }

  // Check for sensitive column access
  if (SENSITIVE_COLUMNS.test(trimmed)) {
    return 'Access to sensitive columns (password_hash) is blocked.'
  }

  return null // safe
}

/**
 * Adds LIMIT if not present, to prevent accidentally dumping huge tables.
 */
function addLimitIfMissing(sql: string): string {
  if (/\bLIMIT\b/i.test(sql)) return sql
  // Remove trailing semicolon before adding LIMIT
  const cleaned = sql.replace(/;\s*$/, '')
  return `${cleaned} LIMIT 50`
}

/**
 * Validates and executes a read-only SQL query.
 * Wraps execution in a read-only transaction with a timeout.
 */
export async function executeSafeQuery(sql: string): Promise<SafeQueryResult> {
  // Step 1: Validate
  const validationError = validateQuery(sql)
  if (validationError) {
    return { success: false, error: validationError }
  }

  // Step 2: Add safety limits
  const safeSql = addLimitIfMissing(sql)

  // Step 3: Execute in read-only transaction with timeout
  const client = await pool.connect()
  try {
    await client.query('SET statement_timeout = 5000') // 5 second timeout
    await client.query('BEGIN TRANSACTION READ ONLY')

    const result = await client.query(safeSql)

    await client.query('COMMIT')

    return {
      success: true,
      rows: result.rows,
      rowCount: result.rowCount ?? 0,
    }
  } catch (err: unknown) {
    await client.query('ROLLBACK').catch(() => {})
    const message = err instanceof Error ? err.message : 'Unknown database error'
    return { success: false, error: `Database error: ${message}` }
  } finally {
    client.release()
  }
}
