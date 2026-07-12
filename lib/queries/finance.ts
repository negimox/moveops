import { query } from '../db'

export async function getFuelLogs() {
  const result = await query(`
    SELECT f.*, v.vehicle_id as vehicle_name, v.registration_no, u.name as logged_by_name 
    FROM fuel_logs f 
    LEFT JOIN vehicles v ON f.vehicle_id = v.id 
    LEFT JOIN users u ON f.logged_by = u.id 
    ORDER BY f.logged_at DESC, f.created_at DESC
  `)
  return result.rows
}

export async function createFuelLog(data: any) {
  const { vehicle_id, liters, cost, odometer_km, fuel_type, station, logged_at, logged_by } = data
  const result = await query(
    `INSERT INTO fuel_logs 
    (vehicle_id, liters, cost, odometer_km, fuel_type, station, logged_at, logged_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [vehicle_id, liters, cost, odometer_km, fuel_type || 'Diesel', station, logged_at || new Date(), logged_by]
  )
  return result.rows[0]
}

export async function getExpenses() {
  const result = await query(`
    SELECT e.*, v.vehicle_id as vehicle_name, t.trip_code, u.name as logged_by_name 
    FROM expenses e 
    LEFT JOIN vehicles v ON e.vehicle_id = v.id 
    LEFT JOIN trips t ON e.trip_id = t.id 
    LEFT JOIN users u ON e.logged_by = u.id 
    ORDER BY e.logged_at DESC, e.created_at DESC
  `)
  return result.rows
}

export async function createExpense(data: any) {
  const { category, amount, vehicle_id, trip_id, description, logged_at, logged_by } = data
  const result = await query(
    `INSERT INTO expenses 
    (category, amount, vehicle_id, trip_id, description, logged_at, logged_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [category, amount, vehicle_id || null, trip_id || null, description, logged_at || new Date(), logged_by]
  )
  return result.rows[0]
}
