import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    // Restrict access to roles that can view/manage drivers
    requireRole(user, 'safety_officer', 'fleet_manager', 'dispatcher')

    const driverId = (await params).id

    const result = await query(
      `SELECT license_data FROM drivers WHERE id = $1`,
      [driverId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    const licenseData = result.rows[0].license_data || {}
    const s3Key = licenseData.s3Key

    if (!s3Key) {
      // Fallback for older verifications that didn't download the file or didn't use S3
      if (licenseData.fileUrl) {
        return NextResponse.json({ url: licenseData.fileUrl })
      }
      return NextResponse.json({ error: 'No license document available' }, { status: 404 })
    }

    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock',
      }
    })
    
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'moveops-licenses',
      Key: s3Key,
    })
    
    // URL expires in 1 hour
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    return NextResponse.json({ url: signedUrl })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    )
  }
}
