/**
 * lib/auth.ts
 * JWT helpers using `jose` — a Web-Crypto-based JWT library that works
 * in both Node.js and the Next.js Edge Runtime.
 *
 * We use HTTP-only cookies (not localStorage) to store the JWT so that
 * client-side JS (including XSS payloads) cannot read the token.
 */

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// ─── Constants ─────────────────────────────────────────────────────────────

const COOKIE_NAME = 'transitops_token'
const EXPIRES_IN_SECONDS = Number(process.env.JWT_EXPIRES_IN ?? 28800) // 8 h

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set in environment variables.')
  return new TextEncoder().encode(secret)
}

// ─── Types ─────────────────────────────────────────────────────────────────

export type UserRole =
  | 'fleet_manager'
  | 'dispatcher'
  | 'safety_officer'
  | 'financial_analyst'

export interface JWTPayload {
  sub: string        // user id (string form of the integer PK)
  name: string
  email: string
  role: UserRole
  iat?: number
  exp?: number
}

// ─── Sign ──────────────────────────────────────────────────────────────────

/**
 * Signs a JWT containing the user's id, name, email, and role.
 * Returns the signed token string.
 */
export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES_IN_SECONDS}s`)
    .sign(getSecret())
}

// ─── Verify ────────────────────────────────────────────────────────────────

/**
 * Verifies a JWT string and returns the typed payload.
 * Throws if the token is expired, malformed, or the signature is invalid.
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getSecret())
  return payload as unknown as JWTPayload
}

// ─── Cookie helpers ────────────────────────────────────────────────────────

/**
 * Reads the JWT from the HTTP-only cookie and verifies it.
 * Returns the payload or null if the token is missing / invalid.
 *
 * Can only be called inside a Server Component, Route Handler, or Middleware
 * because it reads from `next/headers`.
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies()  // async in Next.js 16
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return await verifyToken(token)
  } catch {
    return null
  }
}

/**
 * Sets the HTTP-only auth cookie on the outgoing response.
 * Must be called inside a Route Handler or Server Action.
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: EXPIRES_IN_SECONDS,
  })
}

/**
 * Clears the auth cookie (logout).
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
}

export { COOKIE_NAME }
