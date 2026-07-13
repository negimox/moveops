import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    // Accessible by Financial Analyst and Fleet Manager
    requireRole(user, 'financial_analyst', 'fleet_manager')

    // Revenue by Month (Last 6 Months)
    const revenueQuery = `
      SELECT 
        TO_CHAR(completed_at, 'Mon YYYY') as month,
        SUM(revenue) as total_revenue
      FROM trips
      WHERE status = 'completed' AND completed_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(completed_at, 'Mon YYYY'), EXTRACT(MONTH FROM completed_at), EXTRACT(YEAR FROM completed_at)
      ORDER BY EXTRACT(YEAR FROM completed_at) ASC, EXTRACT(MONTH FROM completed_at) ASC
    `
    const revenueRes = await query(revenueQuery)

    // Costliest Vehicles
    const costsQuery = `
      SELECT 
        v.vehicle_id as name,
        COALESCE(SUM(m.cost), 0) + COALESCE(SUM(f.cost), 0) as total_cost
      FROM vehicles v
      LEFT JOIN maintenance_records m ON v.id = m.vehicle_id
      LEFT JOIN fuel_logs f ON v.id = f.vehicle_id
      GROUP BY v.vehicle_id
      ORDER BY total_cost DESC
      LIMIT 5
    `
    const costsRes = await query(costsQuery)

    return NextResponse.json({
      revenueByMonth: revenueRes.rows,
      costliestVehicles: costsRes.rows
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    )
  }
}
