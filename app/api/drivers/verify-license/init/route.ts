import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { createDigilockerRequest } from '@/lib/setuApi'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    // Safety officer or Fleet manager initiates verification
    if (user.role !== 'safety_officer' && user.role !== 'fleet_manager') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const data = await request.json().catch(() => ({}))
    const driverId = data.driverId

    // Set redirect URL to our drivers page with query params indicating success
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUrl = driverId 
      ? `${appUrl}/drivers?driverId=${driverId}&setu_verify=success`
      : `${appUrl}/drivers?setu_verify_new=success`

    // Call the external Setu API to create a session
    const setuResponse = await createDigilockerRequest(redirectUrl)

    return NextResponse.json({ 
      success: true, 
      id: setuResponse.id,
      url: setuResponse.url
    })
  } catch (error: any) {
    console.error('Digilocker init failed:', error)
    return NextResponse.json(
      { error: error.message || 'Verification Init Failed' },
      { status: error.status || 500 }
    )
  }
}
