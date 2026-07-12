'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'

type Metrics = {
  activeVehicles: number
  availableVehicles: number
  maintenanceVehicles: number
  activeTrips: number
  pendingTrips: number
  driversOnDuty: number
  totalRevenueMonth: number
  fleetUtilisation: string
}

type RevenueData = {
  date: string
  revenue: number
}

type VehicleSummary = {
  id: number
  vehicle_id: string
  type: string
  make_model: string
  status: 'available' | 'on_trip' | 'in_shop' | 'retired'
  region: string
}

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-5 flex flex-col justify-center h-full">
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-3xl font-bold leading-none mb-2" style={{ color }}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}

const statusColors = {
  available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  on_trip: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_shop: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  retired: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

const vehicleColumns: ColumnDef<VehicleSummary>[] = [
  {
    accessorKey: "vehicle_id",
    header: "Vehicle ID",
    cell: ({ row }) => <div className="font-medium">{row.getValue("vehicle_id")}</div>,
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "make_model",
    header: "Make/Model",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("make_model") || '—'}</div>,
  },
  {
    accessorKey: "region",
    header: "Region",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("region") || '—'}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as VehicleSummary["status"]
      return (
        <Badge variant="outline" className={`${statusColors[status]} inline-flex`}>
          {status.replace('_', ' ').toUpperCase()}
        </Badge>
      )
    },
  },
]

export default function DashboardMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([])
  const [loading, setLoading] = useState(true)

  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.metrics) setMetrics(data.metrics)
        if (data.revenueData) setRevenueData(data.revenueData)
        if (data.vehiclesList) setVehicles(data.vehiclesList)
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchType = !typeFilter || v.type === typeFilter
      const matchStatus = !statusFilter || v.status === statusFilter
      const matchRegion = !regionFilter || (v.region || 'North') === regionFilter // defaults to North if null
      return matchType && matchStatus && matchRegion
    })
  }, [vehicles, typeFilter, statusFilter, regionFilter])

  // Get unique values for filters
  const uniqueTypes = useMemo(() => Array.from(new Set(vehicles.map(v => v.type))), [vehicles])
  const uniqueRegions = useMemo(() => Array.from(new Set(vehicles.map(v => v.region || 'North'))), [vehicles])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p>Loading Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Vehicles" value={metrics?.activeVehicles ?? '—'} color="#4f46e5" />
        <KpiCard label="Available Vehicles" value={metrics?.availableVehicles ?? '—'} color="#10b981" />
        <KpiCard label="Vehicles in Maintenance" value={metrics?.maintenanceVehicles ?? '—'} color="#ef4444" />
        <KpiCard label="Fleet Utilisation" value={metrics?.fleetUtilisation ?? '—'} color="#8b5cf6" />
        
        <KpiCard label="Active Trips" value={metrics?.activeTrips ?? '—'} color="#06b6d4" />
        <KpiCard label="Pending Trips" value={metrics?.pendingTrips ?? '—'} color="#f59e0b" />
        <KpiCard label="Drivers On Duty" value={metrics?.driversOnDuty ?? '—'} color="#0ea5e9" />
        <KpiCard label="Revenue (Month)" value={metrics?.totalRevenueMonth ? `₹${metrics.totalRevenueMonth.toLocaleString()}` : '—'} color="#22c55e" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Revenue (Month)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {revenueData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                      formatter={(value: number) => [`₹${value}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No revenue data for this month.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Vehicle Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4">
            <div className="flex flex-wrap gap-4 p-4 bg-muted/20 rounded-lg border border-border">
              <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Type</label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="on_trip">On Trip</option>
                  <option value="in_shop">In Shop</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Region</label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
                >
                  <option value="">All Regions</option>
                  {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto border rounded-md">
              <DataTable columns={vehicleColumns} data={filteredVehicles} searchKey="vehicle_id" searchPlaceholder="Search Vehicle ID..." />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
