/**
 * app/api/settings/route.ts
 * GET  — returns the singleton depot_settings row (open to all authenticated roles).
 * PUT  — updates depot_settings (fleet_manager only).
 *
 * Depot settings are stored in the `depot_settings` table (singleton id = 1).
 * Fields: depot_name, currency, distance_unit.
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// ── GET /api/settings ──────────────────────────────────────────────────────

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await query(
      'SELECT depot_name, currency, distance_unit FROM depot_settings WHERE id = 1'
    )

    if (result.rows.length === 0) {
      // Return safe defaults if the row doesn't exist yet
      return NextResponse.json({
        depot_name: 'TransitOps Depot',
        currency: 'INR',
        distance_unit: 'Kilometer',
      })
    }

    return NextResponse.json(result.rows[0])
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Settings GET]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── PUT /api/settings ──────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only fleet_manager is allowed to mutate settings
  if (user.role !== 'fleet_manager') {
    return NextResponse.json(
      { error: 'Forbidden — only Fleet Manager can update settings.' },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()

    const depotName: string = (body.depot_name ?? '').trim()
    const currency: string = (body.currency ?? 'INR').trim().toUpperCase()
    const distanceUnit: string = (body.distance_unit ?? 'Kilometer').trim()

    // Validate
    if (!depotName) {
      return NextResponse.json({ error: 'depot_name is required.' }, { status: 400 })
    }
    const validUnits = ['Kilometer', 'Meter', 'Inch']
    if (!validUnits.includes(distanceUnit)) {
      return NextResponse.json(
        { error: `distance_unit must be one of: ${validUnits.join(', ')}.` },
        { status: 400 }
      )
    }

    await query(
      `INSERT INTO depot_settings (id, depot_name, currency, distance_unit, updated_at, updated_by)
       VALUES (1, $1, $2, $3, NOW(), $4)
       ON CONFLICT (id) DO UPDATE
         SET depot_name    = EXCLUDED.depot_name,
             currency      = EXCLUDED.currency,
             distance_unit = EXCLUDED.distance_unit,
             updated_at    = NOW(),
             updated_by    = EXCLUDED.updated_by`,
      [depotName, currency, distanceUnit, user.sub]
    )

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Settings PUT]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
