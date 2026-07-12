import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { approveDriver } from '@/lib/queries/drivers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    // Fleet Manager owns the approval of drivers
    requireRole(user, 'fleet_manager')

    const { id } = await params
    const driverId = parseInt(id, 10)

    const driver = await approveDriver(driverId, user.id)

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found or already approved/processed' }, 
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, driver })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    )
  }
}
