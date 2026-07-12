import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [
      activeVehiclesRes,
      availableVehiclesRes,
      maintenanceVehiclesRes,
      activeTripsRes,
      pendingTripsRes,
      driversOnDutyRes,
      totalVehiclesRes,
      vehiclesOnTripRes,
      revenueRes,
      vehiclesListRes
    ] = await Promise.all([
      query('SELECT count(*) as count FROM vehicles WHERE status IN (\'available\', \'on_trip\')'),
      query('SELECT count(*) as count FROM vehicles WHERE status = \'available\''),
      query('SELECT count(*) as count FROM vehicles WHERE status = \'in_shop\''),
      query('SELECT count(*) as count FROM trips WHERE status IN (\'dispatched\', \'on_trip\')'),
      query('SELECT count(*) as count FROM trips WHERE status = \'scheduled\''),
      query('SELECT count(*) as count FROM drivers WHERE status IN (\'available\', \'on_trip\')'),
      query('SELECT count(*) as count FROM vehicles'),
      query('SELECT count(*) as count FROM vehicles WHERE status = \'on_trip\''),
      query(`
        SELECT 
          TO_CHAR(completed_at, 'YYYY-MM-DD') as date,
          SUM(revenue) as daily_revenue
        FROM trips 
        WHERE status = 'completed'
          AND completed_at >= DATE_TRUNC('month', CURRENT_DATE)
        GROUP BY TO_CHAR(completed_at, 'YYYY-MM-DD')
        ORDER BY date ASC
      `),
      query('SELECT id, vehicle_id, type, make_model, status, region FROM vehicles ORDER BY id DESC LIMIT 50')
    ])

    const activeVehicles = parseInt(activeVehiclesRes.rows[0].count)
    const availableVehicles = parseInt(availableVehiclesRes.rows[0].count)
    const maintenanceVehicles = parseInt(maintenanceVehiclesRes.rows[0].count)
    const activeTrips = parseInt(activeTripsRes.rows[0].count)
    const pendingTrips = parseInt(pendingTripsRes.rows[0].count)
    const driversOnDuty = parseInt(driversOnDutyRes.rows[0].count)
    const totalVehicles = parseInt(totalVehiclesRes.rows[0].count)
    const vehiclesOnTrip = parseInt(vehiclesOnTripRes.rows[0].count)
    
    let fleetUtilisation = '0%'
    if (totalVehicles > 0) {
      fleetUtilisation = Math.round((vehiclesOnTrip / totalVehicles) * 100) + '%'
    }

    const revenueData = revenueRes.rows.map(r => ({
      date: r.date,
      revenue: parseFloat(r.daily_revenue)
    }))

    const totalRevenueMonth = revenueData.reduce((acc, curr) => acc + curr.revenue, 0)
    
    const vehiclesList = vehiclesListRes.rows

    return NextResponse.json({
      metrics: {
        activeVehicles,
        availableVehicles,
        maintenanceVehicles,
        activeTrips,
        pendingTrips,
        driversOnDuty,
        totalRevenueMonth,
        fleetUtilisation
      },
      revenueData,
      vehiclesList
    })
  } catch (error: any) {
    console.error('Dashboard API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
