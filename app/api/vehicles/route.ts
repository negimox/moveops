import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { getAllVehicles, createVehicle } from '@/lib/queries/vehicles'

export async function GET() {
  try {
    const user = await getCurrentUser()
    // Fleet Manager owns it; Dispatcher and Financial Analyst need read access.
    requireRole(user, 'fleet_manager', 'dispatcher', 'financial_analyst', 'safety_officer')

    const vehicles = await getAllVehicles()
    return NextResponse.json({ vehicles })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    // Only Fleet Manager can create vehicles
    requireRole(user, 'fleet_manager')

    const data = await request.json()

    if (!data.vehicle_id || !data.type || !data.capacity_kg || data.avg_cost_per_km === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const vehicle = await createVehicle(data)
    return NextResponse.json({ vehicle }, { status: 201 })
  } catch (error: any) {
    if (error.code === '23505') { // postgres unique violation
      return NextResponse.json({ error: 'Vehicle ID or Registration already exists' }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    )
  }
}
