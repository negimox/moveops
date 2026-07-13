/**
 * backend/utils/digilocker.ts
 *
 * Setu DigiLocker Sandbox helpers — backend cron utilities.
 *
 * The Setu DigiLocker API is a consent-based flow:
 *   1. Create a request  →  POST /api/digilocker/
 *                           Returns a requestId + redirect URL for the user
 *   2. Fetch document    →  POST /api/digilocker/:requestId/document
 *                           After the user has granted consent
 *
 * In the cron context we operate against an existing requestId that was
 * previously created and consented to (stored in the DB alongside the driver).
 * If no requestId exists, this utility falls back to initiating a new request.
 *
 * Auth: header-based (x-client-id / x-client-secret / x-product-instance-id)
 * matching the existing lib/setuApi.ts pattern.
 *
 * Environment variables required (see .example.env):
 *   SETU_BASE_URL              – e.g. https://dg-sandbox.setu.co
 *   SETU_CLIENT_ID             – sent as x-client-id header
 *   SETU_CLIENT_SECRET         – sent as x-client-secret header
 *   SETU_PRODUCT_INSTANCE_ID   – sent as x-product-instance-id header
 */

/**
 * Builds the standard Setu auth headers from env vars.
 * Throws if any required variable is missing.
 *
 * @internal — used by verifyDL, exported for testing.
 */
export function getSetuHeaders(): Record<string, string> {
  const { SETU_CLIENT_ID, SETU_CLIENT_SECRET, SETU_PRODUCT_INSTANCE_ID } =
    process.env;

  if (!SETU_CLIENT_ID || !SETU_CLIENT_SECRET || !SETU_PRODUCT_INSTANCE_ID) {
    throw new Error(
      '[DigiLocker] Missing one or more required env vars: ' +
        'SETU_CLIENT_ID, SETU_CLIENT_SECRET, SETU_PRODUCT_INSTANCE_ID'
    );
  }

  return {
    'Content-Type': 'application/json',
    'x-client-id': SETU_CLIENT_ID,
    'x-client-secret': SETU_CLIENT_SECRET,
    'x-product-instance-id': SETU_PRODUCT_INSTANCE_ID,
  };
}

/**
 * @deprecated  The Setu sandbox credentials in this project use header-based
 * auth (x-client-id / x-client-secret), not the OAuth2 token endpoint.
 * Use `getSetuHeaders()` instead.
 */
export async function getSetuToken(): Promise<never> {
  throw new Error(
    '[DigiLocker] getSetuToken() is not used — ' +
      'Setu sandbox auth uses HTTP headers. Call getSetuHeaders() instead.'
  );
}

// ─── Step 1: Create a DigiLocker Request ───────────────────────────────────

export interface SetuDLRequest {
  /** Setu-issued request ID — store this against the driver in the DB. */
  requestId: string;
  /** URL to redirect the driver to for DigiLocker consent. */
  url: string;
}

/**
 * Creates a new DigiLocker DL consent request.
 * The driver must visit the returned `url` to grant consent before
 * `fetchDLDocument()` can be called.
 *
 * @param redirectUrl  – Your callback URL after the user completes consent.
 * @returns            A `SetuDLRequest` with the `requestId` and redirect `url`.
 */
export async function createDLRequest(
  redirectUrl: string
): Promise<SetuDLRequest> {
  const { SETU_BASE_URL } = process.env;
  if (!SETU_BASE_URL) {
    throw new Error('[DigiLocker] Missing required env var: SETU_BASE_URL');
  }

  const response = await fetch(`${SETU_BASE_URL}/api/digilocker/`, {
    method: 'POST',
    headers: getSetuHeaders(),
    body: JSON.stringify({ redirectUrl, docType: 'DRVLC' }),
  });

  let raw: unknown;
  try { raw = await response.json(); } catch { raw = await response.text(); }

  if (!response.ok) {
    throw new Error(
      `[DigiLocker] Create-request failed — HTTP ${response.status}: ${JSON.stringify(raw)}`
    );
  }

  const body = raw as { id?: string; url?: string };
  if (!body.id || !body.url) {
    throw new Error(
      `[DigiLocker] Unexpected create-request response: ${JSON.stringify(raw)}`
    );
  }

  return { requestId: body.id, url: body.url };
}

// ─── Step 2: Fetch the DL Document (after consent) ─────────────────────────

/** Possible verification outcomes derived from the Setu DL document response. */
export type DLStatus = 'VALID' | 'EXPIRED' | 'INVALID' | 'NOT_FOUND' | 'ERROR';

export interface DLVerificationResult {
  /** Normalised status — consumers should branch on this field only. */
  status: DLStatus;
  /** Human-readable message surfaced from the Setu response (if any). */
  message: string;
  /** Raw response body for audit logging / persistence in JSONB column. */
  raw: unknown;
}

/**
 * Fetches the DL document for a previously consented DigiLocker request
 * and normalises the result into a `DLVerificationResult`.
 *
 * Designed to be called from the daily cron for drivers that already have
 * a stored `digilocker_request_id` in the database.
 *
 * @param requestId  – The Setu `requestId` returned by `createDLRequest()`.
 * @param dlNumber   – Driver's license number (used only for log context).
 * @returns          A `DLVerificationResult` describing the license status.
 */
export async function fetchDLDocument(
  requestId: string,
  dlNumber: string
): Promise<DLVerificationResult> {
  const { SETU_BASE_URL } = process.env;
  if (!SETU_BASE_URL) {
    throw new Error('[DigiLocker] Missing required env var: SETU_BASE_URL');
  }

  const url = `${SETU_BASE_URL}/api/digilocker/${requestId}/document`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getSetuHeaders(),
    body: JSON.stringify({ docType: 'DRVLC', format: 'json', consent: 'Y' }),
  });

  let raw: unknown;
  try { raw = await response.json(); } catch { raw = await response.text(); }

  if (!response.ok) {
    console.error(
      `[DigiLocker] Document fetch HTTP error — DL ${dlNumber}, ` +
        `status ${response.status}`,
      raw
    );
    return {
      status: 'ERROR',
      message: `HTTP ${response.status}`,
      raw,
    };
  }

  const body = raw as Record<string, unknown>;

  // Setu returns the document inside a `document` object.
  // We derive validity from the `validTo` (expiry) date if present.
  const doc = body?.document as Record<string, unknown> | undefined;
  const topStatus = String(body?.status ?? '').toUpperCase();

  // The outer `status` field, if present, takes precedence.
  if (topStatus === 'EXPIRED') {
    return { status: 'EXPIRED', message: 'License has expired.', raw };
  }
  if (topStatus === 'INVALID') {
    return { status: 'INVALID', message: 'License is invalid.', raw };
  }
  if (topStatus === 'NOT_FOUND') {
    return { status: 'NOT_FOUND', message: 'License not found in DigiLocker.', raw };
  }

  // Derive status from expiry date when `status` field is absent.
  if (doc?.validTo) {
    const expiry = new Date(doc.validTo as string);
    if (!isNaN(expiry.getTime()) && expiry < new Date()) {
      return {
        status: 'EXPIRED',
        message: `License expired on ${doc.validTo}`,
        raw,
      };
    }
    return { status: 'VALID', message: 'License is valid.', raw };
  }

  // Document received but no expiry — treat as valid (sandbox may omit it).
  if (doc) {
    return { status: 'VALID', message: 'License is valid.', raw };
  }

  console.warn('[DigiLocker] Unrecognised document response for DL:', dlNumber, raw);
  return {
    status: 'ERROR',
    message: `Unrecognised Setu response`,
    raw,
  };
}

/**
 * Convenience alias used by the cron job.
 *
 * Wraps `fetchDLDocument()` — the cron always operates on drivers that
 * already have a stored DigiLocker request ID.
 *
 * @param dlNumber   - License number for log context.
 * @param requestId  - Setu request ID stored in the database for this driver.
 */
export async function verifyDL(
  dlNumber: string,
  requestId: string
): Promise<DLVerificationResult> {
  return fetchDLDocument(requestId, dlNumber);
}
