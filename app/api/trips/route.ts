import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { getAllTrips, createTrip } from '@/lib/queries/trips'

export async function GET() {
  try {
    const user = await getCurrentUser()
    // Dispatcher owns it; Fleet Manager, Safety Officer, Financial Analyst need read access.
    requireRole(user, 'dispatcher', 'fleet_manager', 'safety_officer', 'financial_analyst')

    const trips = await getAllTrips()
    return NextResponse.json({ trips })
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
    // Only Dispatcher can create trips
    requireRole(user, 'dispatcher')

    const data = await request.json()

    if (!data.vehicle_id || !data.driver_id || !data.origin || !data.destination || data.cargo_weight_kg === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const trip = await createTrip({
      ...data,
      dispatcher_id: parseInt(user.sub, 10)
    })
    
    return NextResponse.json({ trip }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    )
  }
}
