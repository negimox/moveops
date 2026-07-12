export async function verifyDrivingLicense(licenseNo: string) {
  const url = `${process.env.SETU_BASE_URL}/api/digilocker/c2d35eca-252a-48a9-a545-ba79e2e6c117/document`
  
  const payload = {
    docType: "DRVLC",
    format: "pdf",
    consent: "Y",
    // Setu sandbox mock params for driving license (typically needs additional parameters like DOB or parameters specific to DRVLC in the body for production, but the prompt gave this exact body)
    // "id": licenseNo // In a real API, the license number would be passed here or in parameters
  }
  
  // NOTE: Based on the hackathon brief:
  // "https://api-playground.setu.co/data/digilocker#/operation~Fetchadocument"
  // Request body:
  // { "docType": "DRVLC", "format": "pdf", "consent": "Y" }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': process.env.SETU_CLIENT_ID || '',
      'x-client-secret': process.env.SETU_CLIENT_SECRET || '',
      'x-product-instance-id': process.env.SETU_PRODUCT_INSTANCE_ID || ''
    },
    body: JSON.stringify(payload)
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || 'Failed to verify license with Setu DigiLocker')
  }

  return data
}
