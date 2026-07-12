import { query } from '../db'
import type { QueryResultRow } from 'pg'

export interface MaintenanceRecord extends QueryResultRow {
  id: number
  vehicle_id: number
  description: string
  cost: string
  status: 'scheduled' | 'in_progress' | 'completed'
  date: Date
  created_at: Date
  updated_at: Date
  // joined fields
  vehicle_identifier: string
  vehicle_type: string
}

export async function getAllMaintenance() {
  const result = await query<MaintenanceRecord>(`
    SELECT 
      m.*, 
      m.service_date as date,
      m.service_type as description,
      v.vehicle_id as vehicle_identifier,
      v.type as vehicle_type
    FROM maintenance_records m
    JOIN vehicles v ON m.vehicle_id = v.id
    ORDER BY m.status DESC, m.service_date DESC
  `)
  return result.rows
}

export async function createMaintenance(data: {
  vehicle_id: number
  description: string
  cost: number
  status: 'scheduled' | 'in_progress' | 'completed'
  date: string
}) {
  // Begin transaction: insert record + auto-switch vehicle to in_shop
  await query('BEGIN')
  try {
    const result = await query<MaintenanceRecord>(
      `INSERT INTO maintenance_records (
        vehicle_id, service_type, cost, status, service_date
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        data.vehicle_id,
        data.description,
        data.cost,
        data.status,
        data.date
      ]
    )

    // Automatically switch vehicle status to in_shop (unless it is on an active trip)
    await query(
      `UPDATE vehicles
       SET status = 'in_shop', updated_at = NOW()
       WHERE id = $1 AND status <> 'on_trip'`,
      [data.vehicle_id]
    )

    await query('COMMIT')
    return result.rows[0]
  } catch (err) {
    await query('ROLLBACK')
    throw err
  }
}

export async function updateMaintenanceStatus(id: number, status: 'scheduled' | 'in_progress' | 'completed') {
  await query('BEGIN')
  try {
    const result = await query<MaintenanceRecord>(
      `UPDATE maintenance_records 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    )

    const record = result.rows[0]

    // When maintenance is completed, restore the vehicle to available
    if (record && status === 'completed') {
      await query(
        `UPDATE vehicles
         SET status = 'available', updated_at = NOW()
         WHERE id = $1 AND status = 'in_shop'`,
        [record.vehicle_id]
      )
    }

    await query('COMMIT')
    return record
  } catch (err) {
    await query('ROLLBACK')
    throw err
  }
}
