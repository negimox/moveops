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

    const { driverId, requestId, newDriverData } = await request.json()

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }
    if (!driverId && !newDriverData) {
      return NextResponse.json({ error: 'Driver ID or New Driver Data is required' }, { status: 400 })
    }

    // Fetch document details from Setu using the requestId from the auth step
    const setuResponse = await fetchDigilockerDocument(requestId)

    let expiryDate = null
    if (setuResponse?.document?.validTo) {
      expiryDate = setuResponse.document.validTo
    } else if (setuResponse?.validUpto) {
      expiryDate = setuResponse.validUpto
    }

    // Attempt to download the file directly from the URL if it exists
    if (setuResponse?.fileUrl) {
      try {
        const fileRes = await fetch(setuResponse.fileUrl)
        if (fileRes.ok) {
          const arrayBuffer = await fileRes.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const mimeType = setuResponse.fileUrl.toLowerCase().includes('.pdf') ? 'application/pdf' : 'image/jpeg'
          const extension = mimeType === 'application/pdf' ? 'pdf' : 'jpg'
          
          const s3Key = `licenses/${requestId}.${extension}`
          
          const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
          const s3Client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock',
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock',
            }
          })
          
          const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME || 'moveops-licenses',
            Key: s3Key,
            Body: buffer,
            ContentType: mimeType,
          })
          await s3Client.send(command)
          
          setuResponse.s3Key = s3Key
        }
      } catch (err) {
        console.error('Failed to download file from Setu URL or upload to S3', err)
      }
    }

    let resultDriver
    if (driverId) {
      // Persist to Postgres database as JSONB for existing driver
      resultDriver = await updateDriverLicenseData(
        driverId,
        setuResponse, // store the whole response body in license_data column
        expiryDate
      )
    } else {
      // Create new driver with verified data
      const { createDriver } = await import('@/lib/queries/drivers')
      resultDriver = await createDriver({
        ...newDriverData,
        registered_by: user.id,
        licenseData: setuResponse,
        licenseExpiry: expiryDate
      })
    }

    return NextResponse.json({ 
      success: true, 
      driver: resultDriver 
    })
  } catch (error: any) {
    console.error('License fetch failed:', error)
    return NextResponse.json(
      { error: error.message || 'Document Fetch Failed' },
      { status: error.status || 500 }
    )
  }
}
