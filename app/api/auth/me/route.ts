/**
 * app/api/auth/me/route.ts
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile from the JWT.
 * Used by the frontend to hydrate the user context on page load.
 */

import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return Response.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  return Response.json({
    user: {
      id: user.sub,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })
}
