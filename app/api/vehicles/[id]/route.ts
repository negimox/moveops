import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { getVehicleById, updateVehicle, deleteVehicle } from '@/lib/queries/vehicles'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    requireRole(user, 'fleet_manager', 'dispatcher', 'financial_analyst', 'safety_officer')

    const { id } = await params
    const vehicle = await getVehicleById(parseInt(id, 10))
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    return NextResponse.json({ vehicle })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    // Only Fleet Manager can update vehicles
    requireRole(user, 'fleet_manager')

    const { id } = await params
    const data = await request.json()

    const vehicle = await updateVehicle(parseInt(id, 10), data)
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    return NextResponse.json({ vehicle })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    // Only Fleet Manager can delete vehicles
    requireRole(user, 'fleet_manager')

    const { id } = await params
    await deleteVehicle(parseInt(id, 10))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    )
  }
}
