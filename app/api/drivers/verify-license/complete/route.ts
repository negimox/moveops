import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { fetchDigilockerDocument } from '@/lib/setuApi'
import { updateDriverLicenseData } from '@/lib/queries/drivers'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (user.role !== 'safety_officer' && user.role !== 'fleet_manager') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { driverId, requestId } = await request.json()

    if (!driverId || !requestId) {
      return NextResponse.json({ error: 'Driver ID and Request ID are required' }, { status: 400 })
    }

    // Fetch document details from Setu using the requestId from the auth step
    const setuResponse = await fetchDigilockerDocument(requestId)

    let expiryDate = null
    if (setuResponse?.document?.validTo) {
      expiryDate = setuResponse.document.validTo
    }

    // Persist to Postgres database as JSONB
    const updatedDriver = await updateDriverLicenseData(
      driverId,
      setuResponse, // store the whole response body in license_data column
      expiryDate
    )

    return NextResponse.json({ 
      success: true, 
      driver: updatedDriver 
    })
  } catch (error: any) {
    console.error('License fetch failed:', error)
    return NextResponse.json(
      { error: error.message || 'Document Fetch Failed' },
      { status: error.status || 500 }
    )
  }
}
