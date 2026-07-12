import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { verifyDrivingLicense } from '@/lib/setuApi'
import { updateDriverLicenseData } from '@/lib/queries/drivers'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    // Safety officer initiates verification
    requireRole(user, 'safety_officer')

    const { driverId, licenseNo } = await request.json()

    if (!driverId || !licenseNo) {
      return NextResponse.json({ error: 'Driver ID and License Number are required' }, { status: 400 })
    }

    // Call the external Setu API
    const setuResponse = await verifyDrivingLicense(licenseNo)

    // Example response structure assumption from Setu DL verification API
    // The actual response might contain details like name, dob, expiry_date inside a 'document' or 'result' object.
    // For this hackathon, we assume Setu returns something we can persist in JSONB
    
    let expiryDate = null
    // Just an example of how you'd extract expiry if it was present
    if (setuResponse?.document?.validTo) {
      expiryDate = setuResponse.document.validTo
    }

    // Persist to Postgres database as JSONB (per user's artifact review feedback)
    const updatedDriver = await updateDriverLicenseData(
      driverId,
      setuResponse, // store the whole response body in license_data column (JSONB)
      expiryDate
    )

    return NextResponse.json({ 
      success: true, 
      driver: updatedDriver 
    })
  } catch (error: any) {
    console.error('License verification failed:', error)
    return NextResponse.json(
      { error: error.message || 'Verification Failed' },
      { status: error.status || 500 }
    )
  }
}
