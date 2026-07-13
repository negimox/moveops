// Smoke test: verify Step 1 of the Setu DigiLocker consent flow
// (Create a request) — the only call that can be made without a pre-consented requestId.
// Run: node scripts/test-setu.mjs
const BASE_URL   = 'https://dg-sandbox.setu.co';
const CLIENT_ID  = '292c6e76-dabf-49c4-8e48-90fba2916673';
const SECRET     = '7IZMe9zvoBBuBukLiCP7n4KLwSOy11oP';
const PRODUCT_ID = 'a1104ec4-7be7-4c70-af78-f5fa72183c6a';

const HEADERS = {
  'Content-Type':           'application/json',
  'x-client-id':            CLIENT_ID,
  'x-client-secret':        SECRET,
  'x-product-instance-id':  PRODUCT_ID,
};

async function run() {
  console.log('=== Step 1: Create DigiLocker DL consent request ===');
  const res = await fetch(`${BASE_URL}/api/digilocker/`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      redirectUrl: 'http://localhost:3000/api/digilocker/callback',
      docType: 'DRVLC',
    }),
  });
  console.log('HTTP:', res.status, res.statusText);
  const body = await res.json();
  console.log('Response:', JSON.stringify(body, null, 2));

  if (res.ok && body.requestId) {
    console.log('\n✓ requestId obtained:', body.requestId);
    console.log('  → Store this against the driver in the DB.');
    console.log('  → Redirect the driver to:', body.url);
    console.log('  → After consent, the cron will call /api/digilocker/:requestId/document');
  }
}

run().catch(err => { console.error('Unhandled error:', err); process.exit(1); });
