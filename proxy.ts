/**
 * proxy.ts
 * Next.js 16 Proxy — runs on the Edge Runtime before every matched request.
 *
 * WHAT IT DOES:
 *   - Protects all /dashboard/* routes — unauthenticated users are redirected to /login
 *   - Protects all /api/* routes (except /api/auth/*) — returns 401 JSON
 *   - Redirects authenticated users away from /login back to /dashboard
 *
 * WHY here instead of per-route checks?
 *   Centralising auth in the proxy means we never accidentally ship a
 *   protected page without a guard. Individual route handlers still call
 *   `requireRole()` for fine-grained permission checks.
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'transitops_token'
const PUBLIC_API   = /^\/api\/auth\//
const PROTECTED_UI = /^\/(dashboard|fleet|drivers|trips|maintenance|fuel-expenses|analytics|settings)/

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET env var is missing.')
  return new TextEncoder().encode(secret)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(COOKIE_NAME)?.value

  // ── Helper: verify token ─────────────────────────────────────────────
  let isAuthenticated = false
  if (token) {
    try {
      await jwtVerify(token, getSecret())
      isAuthenticated = true
    } catch {
      // Token expired or tampered — treat as unauthenticated
    }
  }

  // ── 1. Allow all /api/auth/* without a token ─────────────────────────
  if (PUBLIC_API.test(pathname)) {
    return NextResponse.next()
  }

  // ── 2. Protect /api/* routes ─────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    if (!isAuthenticated) {
      return Response.json(
        { error: 'Unauthorised — please log in.' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // ── 3. Redirect authenticated users away from /login ─────────────────
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ── 4. Protect dashboard routes ──────────────────────────────────────
  if (PROTECTED_UI.test(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)  // preserve intended destination
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  /*
   * Match everything EXCEPT:
   *   - _next/static (static files)
   *   - _next/image  (image optimisation)
   *   - favicon.ico
   *   - public assets (svg, png, etc.)
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
