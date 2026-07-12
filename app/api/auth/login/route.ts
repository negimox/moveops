/**
 * app/api/auth/login/route.ts
 * POST /api/auth/login
 *
 * Authenticates a user with email + password.
 * On success: signs a JWT and sets it as an HTTP-only cookie.
 * On failure: returns 401 with a generic error (no user enumeration).
 */

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'
import { signToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // ── 1. Basic input validation ────────────────────────────────────────
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return Response.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      )
    }

    // ── 2. Fetch user from DB ────────────────────────────────────────────
    const result = await query<{
      id: number
      name: string
      email: string
      password_hash: string
      role: string
      is_active: boolean
    }>(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1 LIMIT 1',
      [email.toLowerCase().trim()]
    )

    const user = result.rows[0]

    // ── 3. Verify password (always compare to prevent timing attacks) ────
    const dummyHash = '$2a$12$invalidhashfortimingatackprevention000000000000000000000'
    const isValid = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, dummyHash) && false  // always false path

    if (!user || !isValid) {
      return Response.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    if (!user.is_active) {
      return Response.json(
        { error: 'Your account has been deactivated. Contact your Fleet Manager.' },
        { status: 403 }
      )
    }

    // ── 4. Sign JWT and set cookie ───────────────────────────────────────
    const token = await signToken({
      sub: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role as Parameters<typeof signToken>[0]['role'],
    })

    await setAuthCookie(token)

    // ── 5. Return user info (no password hash) ───────────────────────────
    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('[POST /api/auth/login]', error)
    return Response.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
