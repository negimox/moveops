import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { updateTripStatus } from '@/lib/queries/trips'

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    // Only dispatcher can update trips
    requireRole(user, 'dispatcher')

    const data = await request.json()
    const { id: paramId } = await props.params
    const id = parseInt(paramId, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid trip ID' }, { status: 400 })
    }

    const VALID_TRIP_STATUSES = ['scheduled', 'dispatched', 'completed', 'cancelled']
    if (!data.status || !VALID_TRIP_STATUSES.includes(data.status)) {
      return NextResponse.json({ error: 'Invalid or missing status' }, { status: 400 })
    }

    let details = undefined
    if (data.status === 'completed') {
      if (data.distance_km === undefined || data.revenue === undefined) {
        return NextResponse.json({ error: 'Distance and revenue are required to complete a trip' }, { status: 400 })
      }
      details = {
        distance_km: parseFloat(data.distance_km),
        revenue: parseFloat(data.revenue)
      }
    }

    const trip = await updateTripStatus(id, data.status, details)
    return NextResponse.json({ trip })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    )
  }
}
