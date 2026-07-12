import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { getAllMaintenance, createMaintenance } from '@/lib/queries/maintenance'

export async function GET() {
  try {
    const user = await getCurrentUser()
    requireRole(user, 'fleet_manager')

    const records = await getAllMaintenance()
    return NextResponse.json({ records })
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
    requireRole(user, 'fleet_manager')

    const data = await request.json()

    if (!data.vehicle_id || !data.description || data.cost === undefined || !data.status || !data.date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const record = await createMaintenance(data)
    return NextResponse.json({ record }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    )
  }
}
