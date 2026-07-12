'use client'

import { useEffect, useState, useMemo } from 'react'
import { Map, Plus, ArrowUpDown, Truck, Calendar, CheckCircle2, Navigation, Loader2, Info, MapPin } from 'lucide-react'
import CreateTripModal from '@/components/trips/CreateTripModal'
import CompleteTripModal from '@/components/trips/CompleteTripModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import VehicleDriverPopover from '@/components/trips/VehicleDriverPopover'
import RoutePopover from '@/components/trips/RoutePopover'

type Trip = {
  id: number
  trip_code: string
  vehicle_reg: string
  driver_name: string
  origin: string
  destination: string
  status: 'scheduled' | 'dispatched' | 'on_trip' | 'completed' | 'cancelled'
  avg_cost_per_km: string
  created_at: string
  vehicle_capacity?: string
  driver_phone?: string
  driver_license_verified?: boolean
  driver_status?: string
}

const statusConfig = {
  scheduled: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Scheduled' },
  dispatched: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Dispatched' },
  on_trip: { color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', label: 'On Trip' },
  completed: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Completed' },
  cancelled: { color: 'text-destructive bg-destructive/10 border-destructive/20', label: 'Cancelled' },
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [completeModalTripId, setCompleteModalTripId] = useState<number | null>(null)
  const [completeModalCost, setCompleteModalCost] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchTrips = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/trips')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTrips(data.trips)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrips()
  }, [])

  const updateStatus = async (id: number, newStatus: string) => {
    if (newStatus === 'cancelled' && !window.confirm(`Are you sure you want to cancel this trip?`)) {
      return
    }

    setActionLoading(`${id}-${newStatus}`)
    try {
      const res = await fetch(`/api/trips/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) await fetchTrips()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(null)
    }
  }

  const columns = useMemo<ColumnDef<Trip>[]>(() => [
    {
      accessorKey: "trip_code",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 hover:bg-transparent hover:text-primary"
          >
            Trip Code
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("trip_code")}</div>,
    },
    {
      accessorKey: "assignment",
      header: "Vehicle & Driver",
      cell: ({ row }) => {
        const trip = row.original
        return (
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer p-1.5 -ml-1.5 rounded-md transition-colors w-fit border border-transparent hover:border-border hover:bg-muted group">
                <div className="flex flex-col">
                  <span className="font-medium border-b border-dashed border-primary/40 group-hover:border-primary transition-colors">{trip.vehicle_reg || 'N/A'}</span>
                  <span className="text-xs text-muted-foreground">{trip.driver_name || 'N/A'}</span>
                </div>
                <Info className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-auto p-4">
              <VehicleDriverPopover trip={trip} />
            </PopoverContent>
          </Popover>
        )
      },
    },
    {
      accessorKey: "route",
      header: "Route",
      cell: ({ row }) => {
        const trip = row.original
        return (
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-2 max-w-[250px] cursor-pointer p-1.5 -ml-1.5 rounded-md transition-colors border border-transparent hover:border-border hover:bg-muted group">
                <span className="truncate block flex-1 font-medium border-b border-dashed border-primary/40 group-hover:border-primary transition-colors">{trip.origin}</span>
                <span className="text-xs shrink-0 text-muted-foreground">→</span>
                <span className="truncate block flex-1 font-medium border-b border-dashed border-primary/40 group-hover:border-primary transition-colors">{trip.destination}</span>
                <MapPin className="w-4 h-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-auto p-4">
              <RoutePopover originName={trip.origin} destinationName={trip.destination} />
            </PopoverContent>
          </Popover>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 hover:bg-transparent hover:text-primary"
          >
            Created On
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-muted-foreground">{new Date(row.original.created_at).toLocaleDateString()}</div>,
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 hover:bg-transparent hover:text-primary"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const status = row.getValue("status") as Trip["status"]
        return (
          <Badge variant="outline" className={`inline-flex px-2.5 py-1 text-xs font-medium border rounded-full ${statusConfig[status].color}`}>
            {statusConfig[status].label}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const r = row.original
        const isAnyLoading = actionLoading !== null
        return (
          <div className="text-right space-x-2">
            {r.status === 'scheduled' && (
              <>
                <Button disabled={isAnyLoading} variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateStatus(r.id, 'dispatched'); }} className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 h-8 px-2 text-xs">
                  {actionLoading === `${r.id}-dispatched` && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                  Dispatch
                </Button>
                <Button disabled={isAnyLoading} variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateStatus(r.id, 'cancelled'); }} className="text-destructive hover:bg-destructive/10 h-8 px-2 text-xs">
                  {actionLoading === `${r.id}-cancelled` && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                  Cancel
                </Button>
              </>
            )}
            {r.status === 'dispatched' && (
              <Button disabled={isAnyLoading} variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateStatus(r.id, 'on_trip'); }} className="text-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10 h-8 px-2 text-xs">
                {actionLoading === `${r.id}-on_trip` && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                Mark On Trip
              </Button>
            )}
            {r.status === 'on_trip' && (
              <Button disabled={isAnyLoading} variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCompleteModalCost(r.avg_cost_per_km); setCompleteModalTripId(r.id); }} className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 h-8 px-2 text-xs">
                Complete
              </Button>
            )}
          </div>
        )
      },
    },
  ], [])

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Map className="w-6 h-6 text-primary" />
            Trip Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Create, dispatch, and track active trips across the fleet.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Trip
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Map className="w-4 h-4 text-primary" /></div>
              Total Trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{trips.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg"><Calendar className="w-4 h-4 text-amber-500" /></div>
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{trips.filter(t => t.status === 'scheduled').length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg"><Navigation className="w-4 h-4 text-indigo-500" /></div>
              On Trip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{trips.filter(t => t.status === 'on_trip').length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{trips.filter(t => t.status === 'completed').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 h-48 text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading trips...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-destructive bg-destructive/10">
            {error}
          </div>
        ) : (
          <DataTable columns={columns} data={trips} searchKey="trip_code" searchPlaceholder="Search by Trip Code..." />
        )}
      </Card>

      <CreateTripModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchTrips} 
      />

      <CompleteTripModal
        isOpen={completeModalTripId !== null}
        tripId={completeModalTripId}
        avgCostPerKm={completeModalCost}
        onClose={() => { setCompleteModalTripId(null); setCompleteModalCost(null); }}
        onSuccess={fetchTrips}
      />
    </div>
  )
}
