import { query } from '../db'
import type { QueryResultRow } from 'pg'

export interface Vehicle extends QueryResultRow {
  id: number
  vehicle_id: string
  type: string
  make_model: string | null
  year: number | null
  registration_no: string | null
  capacity_kg: number
  status: 'available' | 'on_trip' | 'in_shop' | 'retired'
  avg_cost_per_km: string
  total_trips: number
  total_earnings: string
  notes: string | null
  region: string
  created_at: Date
  updated_at: Date
}

export async function getAllVehicles() {
  const result = await query<Vehicle>(`
    SELECT * FROM vehicles
    ORDER BY status, vehicle_id
  `)
  return result.rows
}

export async function getVehicleById(id: number) {
  const result = await query<Vehicle>(
    'SELECT * FROM vehicles WHERE id = $1',
    [id]
  )
  return result.rows[0] || null
}

export async function createVehicle(data: {
  vehicle_id: string
  type: string
  make_model?: string
  year?: number
  registration_no?: string
  capacity_kg: number
  avg_cost_per_km: number
  notes?: string
  region: string
}) {
  const result = await query<Vehicle>(
    `INSERT INTO vehicles (
      vehicle_id, type, make_model, year, registration_no, capacity_kg, avg_cost_per_km, notes, region
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      data.vehicle_id,
      data.type,
      data.make_model || null,
      data.year || null,
      data.registration_no || null,
      data.capacity_kg,
      data.avg_cost_per_km,
      data.notes || null,
      data.region,
    ]
  )
  return result.rows[0]
}

export async function updateVehicle(
  id: number,
  data: Partial<{
    status: 'available' | 'on_trip' | 'in_shop' | 'retired'
    avg_cost_per_km: number
    notes: string
  }>
) {
  // Build dynamic update query
  const sets: string[] = []
  const values: unknown[] = []
  let paramIdx = 1

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      sets.push(`${key} = $${paramIdx}`)
      values.push(val)
      paramIdx++
    }
  }

  if (sets.length === 0) return await getVehicleById(id)

  sets.push(`updated_at = NOW()`)
  values.push(id)

  const result = await query<Vehicle>(
    `UPDATE vehicles SET ${sets.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
    values
  )
  return result.rows[0] || null
}

export async function deleteVehicle(id: number) {
  // First check if it can be deleted
  const v = await getVehicleById(id)
  if (!v) throw new Error('Vehicle not found')
  if (v.status === 'on_trip') throw new Error('Cannot delete a vehicle that is currently on a trip')

  await query('DELETE FROM vehicles WHERE id = $1', [id])
}
