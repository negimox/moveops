import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { getFuelLogs, createFuelLog } from '@/lib/queries/finance'

export async function GET() {
  try {
    const user = await getCurrentUser()
    // Accessible by Financial Analyst and Fleet Manager
    requireRole(user, 'financial_analyst', 'fleet_manager')

    const logs = await getFuelLogs()
    return NextResponse.json({ logs })
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
    // Only Financial Analyst can log fuel
    requireRole(user, 'financial_analyst')

    const data = await request.json()

    if (!data.vehicle_id || !data.liters || !data.cost) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const log = await createFuelLog({
      ...data,
      logged_by: user.id
    })

    return NextResponse.json({ log }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    )
  }
}
