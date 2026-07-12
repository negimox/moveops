import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { getAllDrivers, createDriver } from '@/lib/queries/drivers'

export async function GET() {
  try {
    const user = await getCurrentUser()
    // Accessible by Safety Officer (owner), Fleet Manager (approver/viewer), Dispatcher (viewer)
    requireRole(user, 'safety_officer', 'fleet_manager', 'dispatcher')

    const drivers = await getAllDrivers()
    return NextResponse.json({ drivers })
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
    // Only Safety Officer can register a driver
    requireRole(user, 'safety_officer')

    const data = await request.json()

    if (!data.name || !data.contact || !data.license_id || !data.category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const driver = await createDriver({
      ...data,
      registered_by: user.id
    })

    return NextResponse.json({ driver }, { status: 201 })
  } catch (error: any) {
    if (error.code === '23505') { // postgres unique violation
      return NextResponse.json({ error: 'License ID already exists' }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    )
  }
}
