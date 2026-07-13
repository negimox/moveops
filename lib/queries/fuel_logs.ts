import { query } from '../db'
import type { QueryResultRow } from 'pg'

export interface FuelLog extends QueryResultRow {
  id: number
  vehicle_id: number
  liters: string // numeric in db is parsed as string in node-postgres
  cost: string
  odometer_km: number | null
  fuel_type: string
  station: string | null
  date: Date
  logged_by: number
  created_at: Date
}

export async function getAllFuelLogs() {
  const result = await query<FuelLog>(`
    SELECT * FROM fuel_logs
    ORDER BY date DESC
  `)
  return result.rows
}

export async function createFuelLog(data: {
  vehicle_id: number
  liters: number
  cost: number
  odometer_km?: number
  fuel_type?: string
  station?: string
  date?: string
  logged_by: number
}) {
  const result = await query<FuelLog>(
    `INSERT INTO fuel_logs (
      vehicle_id, liters, cost, odometer_km, fuel_type, station, date, logged_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      data.vehicle_id,
      data.liters,
      data.cost,
      data.odometer_km || null,
      data.fuel_type || 'Diesel',
      data.station || null,
      data.date || new Date().toISOString().split('T')[0],
      data.logged_by
    ]
  )
  return result.rows[0]
}
