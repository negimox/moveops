/**
 * backend/utils/digilocker.ts
 *
 * Setu DigiLocker Sandbox helpers.
 * Provides two thin wrappers around the Setu API so the rest of the codebase
 * never has to deal with auth headers or raw fetch calls directly.
 *
 * Environment variables required (see .example.env):
 *   SETU_BASE_URL              – e.g. https://dg-sandbox.setu.co
 *   SETU_CLIENT_ID             – OAuth2 client id
 *   SETU_CLIENT_SECRET         – OAuth2 client secret
 *   SETU_PRODUCT_INSTANCE_ID   – Product instance tied to the DL consent flow
 */

/** Shape of the token response returned by Setu's auth endpoint. */
interface SetuTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Fetches a short-lived Bearer token from the Setu OAuth2 endpoint.
 *
 * @returns The raw `access_token` string.
 * @throws  If required env vars are missing or the API returns a non-2xx status.
 */
export async function getSetuToken(): Promise<string> {
  const { SETU_BASE_URL, SETU_CLIENT_ID, SETU_CLIENT_SECRET } = process.env;

  if (!SETU_BASE_URL || !SETU_CLIENT_ID || !SETU_CLIENT_SECRET) {
    throw new Error(
      '[DigiLocker] Missing one or more required env vars: ' +
        'SETU_BASE_URL, SETU_CLIENT_ID, SETU_CLIENT_SECRET'
    );
  }

  const url = `${SETU_BASE_URL}/api/v2/auth/token`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientID: SETU_CLIENT_ID,
      secret: SETU_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `[DigiLocker] Token request failed — HTTP ${response.status}: ${errorBody}`
    );
  }

  const data = (await response.json()) as SetuTokenResponse;
  return data.access_token;
}

// ─── DL Verification ───────────────────────────────────────────────────────

/** Possible verification outcomes returned from Setu's DL check endpoint. */
export type DLStatus = 'VALID' | 'EXPIRED' | 'INVALID' | 'NOT_FOUND' | 'ERROR';

export interface DLVerificationResult {
  /** Normalised status — consumers should branch on this field only. */
  status: DLStatus;
  /** Human-readable message surfaced from the Setu response (if any). */
  message: string;
  /** Raw response body for audit logging. */
  raw: unknown;
}

/**
 * Verifies a Driving License against the Setu DigiLocker DL API.
 *
 * @param dlNumber  - The driving license number to verify (e.g. "MH01 20110000001")
 * @param dob       - Date of birth in `YYYY-MM-DD` format, as required by the Setu API
 * @returns         A `DLVerificationResult` describing the license status.
 */
export async function verifyDL(
  dlNumber: string,
  dob: string
): Promise<DLVerificationResult> {
  const { SETU_BASE_URL, SETU_PRODUCT_INSTANCE_ID } = process.env;

  if (!SETU_BASE_URL || !SETU_PRODUCT_INSTANCE_ID) {
    throw new Error(
      '[DigiLocker] Missing one or more required env vars: ' +
        'SETU_BASE_URL, SETU_PRODUCT_INSTANCE_ID'
    );
  }

  // Obtain a fresh token for every verification call so we never operate on
  // a stale token. Setu tokens are short-lived and the cost of the extra
  // round-trip is negligible compared to a failed license check.
  const token = await getSetuToken();

  const url = `${SETU_BASE_URL}/api/v2/digilocker/dl`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-product-instance-id': SETU_PRODUCT_INSTANCE_ID,
    },
    body: JSON.stringify({ dlNumber, dob }),
  });

  // Parse body regardless of status so we can surface meaningful error info.
  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    raw = await response.text();
  }

  // Map HTTP + payload to a normalised DLStatus.
  if (!response.ok) {
    console.error(
      `[DigiLocker] DL verification HTTP error — status ${response.status}`,
      raw
    );
    return { status: 'ERROR', message: `HTTP ${response.status}`, raw };
  }

  // Setu sandbox returns a top-level `status` field whose value mirrors the
  // DigiLocker verification outcome. Normalise it defensively.
  const body = raw as Record<string, unknown>;
  const setuStatus = String(body?.status ?? '').toUpperCase();

  switch (setuStatus) {
    case 'VALID':
      return { status: 'VALID', message: 'License is valid.', raw };

    case 'EXPIRED':
      return { status: 'EXPIRED', message: 'License has expired.', raw };

    case 'INVALID':
      return { status: 'INVALID', message: 'License is invalid.', raw };

    case 'NOT_FOUND':
      return { status: 'NOT_FOUND', message: 'License not found in DigiLocker.', raw };

    default:
      console.warn('[DigiLocker] Unrecognised status from Setu:', setuStatus, raw);
      return {
        status: 'ERROR',
        message: `Unrecognised Setu status: "${setuStatus}"`,
        raw,
      };
  }
}
