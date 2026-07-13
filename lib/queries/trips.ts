import { query } from '../db'
import type { QueryResultRow } from 'pg'

export interface Trip extends QueryResultRow {
  id: number
  trip_code: string
  vehicle_id: number
  driver_id: number
  dispatcher_id: number
  origin: string
  destination: string
  status: 'scheduled' | 'dispatched' | 'completed' | 'cancelled'
  cargo_weight_kg: string
  distance_km: string | null
  planned_distance_km: string | null
  revenue: string
  scheduled_at: Date
  completed_at: Date | null
  notes: string | null
  created_at: Date
  updated_at: Date
  
  // Joined fields
  vehicle_reg?: string
  vehicle_type?: string
  vehicle_capacity?: string
  driver_name?: string
  driver_phone?: string
  driver_license_verified?: boolean
  driver_status?: string
  dispatcher_name?: string
  avg_cost_per_km?: string
}

export async function getAllTrips() {
  const result = await query<Trip>(`
    SELECT 
      t.*,
      v.registration_no as vehicle_reg,
      v.type as vehicle_type,
      v.capacity_kg as vehicle_capacity,
      v.avg_cost_per_km as avg_cost_per_km,
      d.name as driver_name,
      d.contact as driver_phone,
      d.license_verified as driver_license_verified,
      d.status as driver_status,
      u.name as dispatcher_name
    FROM trips t
    JOIN vehicles v ON t.vehicle_id = v.id
    JOIN drivers d ON t.driver_id = d.id
    JOIN users u ON t.dispatcher_id = u.id
    ORDER BY t.created_at DESC
  `)
  return result.rows
}

export async function getTripById(id: number) {
  const result = await query<Trip>(`
    SELECT 
      t.*,
      v.registration_no as vehicle_reg,
      v.type as vehicle_type,
      v.capacity_kg as vehicle_capacity,
      v.avg_cost_per_km as avg_cost_per_km,
      d.name as driver_name,
      d.contact as driver_phone,
      d.license_verified as driver_license_verified,
      d.status as driver_status,
      u.name as dispatcher_name
    FROM trips t
    JOIN vehicles v ON t.vehicle_id = v.id
    JOIN drivers d ON t.driver_id = d.id
    JOIN users u ON t.dispatcher_id = u.id
    WHERE t.id = $1
  `, [id])
  return result.rows[0] || null
}

export async function createTrip(data: {
  vehicle_id: number
  driver_id: number
  dispatcher_id: number
  origin: string
  destination: string
  cargo_weight_kg: number
  planned_distance_km?: number
  notes?: string
}) {
  const trip_code = `TRP-${Math.floor(100000 + Math.random() * 900000)}`
  
  // Begin transaction to reserve vehicle and driver
  await query('BEGIN')
  
  try {
    const result = await query<Trip>(
      `INSERT INTO trips (
        trip_code, vehicle_id, driver_id, dispatcher_id, origin, destination, cargo_weight_kg, planned_distance_km, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        trip_code,
        data.vehicle_id,
        data.driver_id,
        data.dispatcher_id,
        data.origin,
        data.destination,
        data.cargo_weight_kg,
        data.planned_distance_km || null,
        data.notes || null,
      ]
    )
    
    // Mark vehicle and driver as on_trip to avoid double booking
    await query(`UPDATE vehicles SET status = 'on_trip' WHERE id = $1`, [data.vehicle_id])
    await query(`UPDATE drivers SET status = 'on_trip' WHERE id = $1`, [data.driver_id])
    
    await query('COMMIT')
    return result.rows[0]
  } catch (err) {
    await query('ROLLBACK')
    throw err
  }
}

export async function updateTripStatus(
  id: number,
  status: 'scheduled' | 'dispatched' | 'completed' | 'cancelled',
  details?: {
    distance_km?: number
    revenue?: number
  }
) {
  await query('BEGIN')
  
  try {
    const trip = await getTripById(id)
    if (!trip) throw new Error('Trip not found')

    const sets: string[] = ['status = $1', 'updated_at = NOW()']
    const values: any[] = [status]
    let paramIdx = 2

    if (status === 'completed' && details) {
      sets.push(`distance_km = $${paramIdx++}`)
      values.push(details.distance_km)
      
      sets.push(`revenue = $${paramIdx++}`)
      values.push(details.revenue)
      
      sets.push(`completed_at = NOW()`)
    }

    values.push(id) // last parameter for WHERE id = ?
    
    const result = await query<Trip>(
      `UPDATE trips SET ${sets.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values
    )

    // Free up vehicle and driver if completed or cancelled
    if (status === 'completed' || status === 'cancelled') {
      await query(`UPDATE vehicles SET status = 'available' WHERE id = $1`, [trip.vehicle_id])
      await query(`UPDATE drivers SET status = 'available' WHERE id = $1`, [trip.driver_id])
      
      if (status === 'completed') {
         // Optionally update total_trips and total_earnings on vehicle
         await query(`
           UPDATE vehicles 
           SET total_trips = total_trips + 1,
               total_earnings = total_earnings + $1
           WHERE id = $2
         `, [details?.revenue || 0, trip.vehicle_id])
         
         await query(`UPDATE drivers SET trip_count = trip_count + 1 WHERE id = $1`, [trip.driver_id])
      }
    }

    await query('COMMIT')
    return result.rows[0]
  } catch (err) {
    await query('ROLLBACK')
    throw err
  }
}
