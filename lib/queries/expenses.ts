import { query } from '../db'
import type { QueryResultRow } from 'pg'

export interface Expense extends QueryResultRow {
  id: number
  type: string
  amount: string // numeric is parsed as string in pg
  vehicle_id: number | null
  trip_id: number | null
  description: string | null
  logged_at: Date
  logged_by: number
  created_at: Date
}

export async function getAllExpenses() {
  const result = await query<Expense>(`
    SELECT * FROM expenses
    ORDER BY logged_at DESC
  `)
  return result.rows
}

export async function createExpense(data: {
  type: string
  amount: number
  vehicle_id?: number
  trip_id?: number
  description?: string
  logged_at?: string
  logged_by: number
}) {
  const result = await query<Expense>(
    `INSERT INTO expenses (
      type, amount, vehicle_id, trip_id, description, logged_at, logged_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      data.type,
      data.amount,
      data.vehicle_id || null,
      data.trip_id || null,
      data.description || null,
      data.logged_at || new Date().toISOString().split('T')[0],
      data.logged_by
    ]
  )
  return result.rows[0]
}
