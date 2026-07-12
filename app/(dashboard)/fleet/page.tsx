'use client'

import { useEffect, useState } from 'react'
import { Plus, Truck, Settings, Activity, ArrowUpDown } from 'lucide-react'
import AddVehicleModal from '@/components/fleet/AddVehicleModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'

type Vehicle = {
  id: number
  vehicle_id: string
  type: string
  make_model: string | null
  year: number | null
  registration_no: string | null
  capacity_kg: number
  status: 'available' | 'on_trip' | 'in_shop' | 'retired'
  avg_cost_per_km: string
  total_trips: number
  total_earnings: string
}

const statusColors = {
  available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  on_trip: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_shop: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  retired: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export const columns: ColumnDef<Vehicle>[] = [
  {
    accessorKey: "vehicle_id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 hover:bg-transparent hover:text-primary"
        >
          Vehicle ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("vehicle_id")}</div>,
  },
  {
    accessorKey: "type",
    header: "Type & Make",
    cell: ({ row }) => {
      const vehicle = row.original
      return (
        <div className="flex flex-col">
          <span className="font-medium">{vehicle.type}</span>
          <span className="text-xs text-muted-foreground">{vehicle.year ? `${vehicle.year} ` : ''}{vehicle.make_model || 'Unknown Make'}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "registration_no",
    header: "Reg. No",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("registration_no") || '—'}</div>,
  },
  {
    accessorKey: "capacity_kg",
    header: "Capacity",
    cell: ({ row }) => <div className="text-muted-foreground">{(row.getValue("capacity_kg") as number).toLocaleString()} kg</div>,
  },
  {
    accessorKey: "avg_cost_per_km",
    header: "Cost / Km",
    cell: ({ row }) => <div className="font-mono text-emerald-500">₹{row.getValue("avg_cost_per_km")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Vehicle["status"]
      return (
        <div className="text-center">
          <Badge variant="outline" className={`${statusColors[status]}`}>
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      )
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: () => (
      <div className="text-right">
        <Button variant="ghost" className="text-primary hover:text-primary/80">
          Edit
        </Button>
      </div>
    ),
  },
]

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/vehicles')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setVehicles(data.vehicles)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  return (
    <div className="p-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            Fleet Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your vehicles, track status, and monitor fleet performance.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Vehicle
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Truck className="w-4 h-4 text-primary" /></div>
              Total Fleet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vehicles.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><Activity className="w-4 h-4 text-emerald-500" /></div>
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vehicles.filter(v => v.status === 'available').length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Truck className="w-4 h-4 text-blue-500" /></div>
              On Trip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vehicles.filter(v => v.status === 'on_trip').length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg"><Settings className="w-4 h-4 text-amber-500" /></div>
              In Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vehicles.filter(v => v.status === 'in_shop').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 h-48 text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading fleet data...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-destructive bg-destructive/10">
            {error}
          </div>
        ) : (
          <DataTable columns={columns} data={vehicles} searchKey="vehicle_id" searchPlaceholder="Search by Vehicle ID..." />
        )}
      </Card>

      <AddVehicleModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchVehicles} 
      />
    </div>
  )
}
