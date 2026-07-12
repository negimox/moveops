import { query } from '../db'
import type { QueryResultRow } from 'pg'

export interface Driver extends QueryResultRow {
  id: number
  name: string
  contact: string
  license_id: string
  license_verified: boolean
  license_expiry: string | null
  license_data: any | null
  category: string
  status: 'available' | 'on_trip' | 'off_duty' | 'suspended'
  trip_count: number
  safety: 'available' | 'on_trip' | 'off_duty' | 'suspended'
  registered_by: number | null
  approved_by: number | null
  created_at: Date
  updated_at: Date
}

export async function getAllDrivers() {
  const result = await query<Driver>(`
    SELECT * FROM drivers
    ORDER BY status, name
  `)
  return result.rows
}

export async function createDriver(data: {
  name: string
  contact: string
  license_id: string
  category: string
  registered_by: number
  licenseData?: any
  licenseExpiry?: string | null
}) {
  const result = await query<Driver>(
    `INSERT INTO drivers (
      name, contact, license_id, category, registered_by, status, license_verified, license_data, license_expiry
    ) VALUES ($1, $2, $3, $4, $5, 'available', true, $6, $7)
    RETURNING *`,
    [
      data.name,
      data.contact,
      data.license_id,
      data.category,
      data.registered_by,
      data.licenseData ? JSON.stringify(data.licenseData) : null,
      data.licenseExpiry || null
    ]
  )
  return result.rows[0]
}

export async function approveDriver(id: number, fleetManagerId: number) {
  const result = await query<Driver>(
    `UPDATE drivers 
     SET status = 'available', approved_by = $1, updated_at = NOW() 
     WHERE id = $2 AND status = 'pending_approval'
     RETURNING *`,
    [fleetManagerId, id]
  )
  return result.rows[0]
}

export async function suspendDriver(id: number) {
  const result = await query<Driver>(
    `UPDATE drivers 
     SET status = 'suspended', updated_at = NOW() 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}

export async function updateDriverLicenseData(id: number, licenseData: any, expiryDate: string | null = null) {
  const result = await query<Driver>(
    `UPDATE drivers 
     SET license_verified = true, 
         license_data = $1, 
         license_expiry = COALESCE($2, license_expiry),
         updated_at = NOW() 
     WHERE id = $3 
     RETURNING *`,
    [JSON.stringify(licenseData), expiryDate, id]
  )
  return result.rows[0]
}
