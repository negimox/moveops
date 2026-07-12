/**
 * app/api/auth/logout/route.ts
 * POST /api/auth/logout
 *
 * Clears the auth cookie. No DB call needed — the token simply expires.
 */

import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  try {
    await clearAuthCookie()
    return Response.json({ message: 'Logged out successfully.' })
  } catch (error) {
    console.error('[POST /api/auth/logout]', error)
    return Response.json({ error: 'Logout failed.' }, { status: 500 })
  }
}
