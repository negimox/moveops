import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { query } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    // Safety Officer or Fleet Manager can update status
    requireRole(user, 'safety_officer', 'fleet_manager')

    const { id } = await params
    const driverId = parseInt(id, 10)
    
    const { status, safety } = await request.json()

    if (status && !['available', 'on_trip', 'off_duty', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    
    if (safety && !['available', 'on_trip', 'off_duty', 'suspended'].includes(safety)) {
      return NextResponse.json({ error: 'Invalid safety status' }, { status: 400 })
    }

    const result = await query(
      `UPDATE drivers SET 
        status = COALESCE($1, status),
        safety = COALESCE($2, safety),
        updated_at = NOW() 
       WHERE id = $3 RETURNING *`,
      [status || null, safety || null, driverId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, driver: result.rows[0] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    )
  }
}
