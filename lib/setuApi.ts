/**
 * lib/setuApi.ts
 * Integrates with Setu DigiLocker Sandbox API
 */

const HEADERS = {
  'Content-Type': 'application/json',
  'x-client-id': process.env.SETU_CLIENT_ID || '',
  'x-client-secret': process.env.SETU_CLIENT_SECRET || '',
  'x-product-instance-id': process.env.SETU_PRODUCT_INSTANCE_ID || ''
}

/**
 * Step 1: Create a DigiLocker request session.
 * @param redirectUrl URL to redirect the user to after DigiLocker login
 * @returns { id, status, url, validUpto, traceId }
 */
export async function createDigilockerRequest(redirectUrl: string) {
  const url = `${process.env.SETU_BASE_URL}/api/digilocker`
  
  const payload = {
    redirectUrl
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload)
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || 'Failed to create Setu DigiLocker request')
  }

  return data
}

/**
 * Step 3: Fetch the document from DigiLocker using the requestId (id from Step 1).
 * @param requestId The ID returned from createDigilockerRequest
 */
export async function fetchDigilockerDocument(requestId: string) {
  const url = `${process.env.SETU_BASE_URL}/api/digilocker/${requestId}/document`
  
  const payload = {
    docType: "DRVLC",
    format: "pdf",
    consent: "Y"
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload)
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch document from Setu DigiLocker')
  }

  return data
}
