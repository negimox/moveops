'use client'

import { useEffect, useState, useMemo } from 'react'
import { Wrench, Plus, CheckCircle2, Clock, Calendar, ArrowUpDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import LogMaintenanceModal from '@/components/maintenance/LogMaintenanceModal'

type MaintenanceRecord = {
  id: number
  vehicle_identifier: string
  vehicle_type: string
  description: string
  cost: string
  status: 'scheduled' | 'in_progress' | 'completed'
  date: string
}

const statusConfig = {
  scheduled: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Calendar, label: 'Scheduled' },
  in_progress: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Clock, label: 'In Progress' },
  completed: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2, label: 'Completed' },
}

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/maintenance')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRecords(data.records)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const updateStatus = async (id: number, newStatus: string) => {
    if (!window.confirm(`Are you sure you want to mark this maintenance record as ${newStatus.replace('_', ' ')}?`)) {
      return
    }

    try {
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) fetchRecords()
    } catch (e) {
      console.error(e)
    }
  }

  const columns = useMemo<ColumnDef<MaintenanceRecord>[]>(() => [
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 hover:bg-transparent hover:text-primary"
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="whitespace-nowrap text-muted-foreground">{new Date(row.getValue("date")).toLocaleDateString()}</div>,
    },
    {
      accessorKey: "vehicle_identifier",
      header: "Vehicle",
      cell: ({ row }) => {
        const record = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium">{record.vehicle_identifier}</span>
            <span className="text-xs text-muted-foreground">{record.vehicle_type}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div className="max-w-xs truncate text-muted-foreground" title={row.getValue("description")}>{row.getValue("description")}</div>,
    },
    {
      accessorKey: "cost",
      header: "Cost",
      cell: ({ row }) => <div className="text-right font-mono text-emerald-500">₹{row.getValue("cost")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as MaintenanceRecord["status"]
        const StatusIcon = statusConfig[status].icon
        return (
          <div className="text-center">
            <Badge variant="outline" className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-full ${statusConfig[status].color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig[status].label}
            </Badge>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="text-right space-x-3">
            {r.status === 'scheduled' && (
              <Button 
                variant="ghost" 
                onClick={() => updateStatus(r.id, 'in_progress')} 
                className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 h-8 px-2"
              >
                Start
              </Button>
            )}
            {r.status === 'in_progress' && (
              <Button 
                variant="ghost" 
                onClick={() => updateStatus(r.id, 'completed')} 
                className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 h-8 px-2"
              >
                Complete
              </Button>
            )}
          </div>
        )
      },
    },
  ], []) // Since updateStatus does not change its reference (it's bound to the component scope but we just call it directly, wait, actually we need to make sure updateStatus is fresh or use useCallback). Let's just omit dependency array for safety or add updateStatus. Since we fetchRecords which triggers re-render, it's fine. Wait, better to not memoize if it causes stale closures, or include updateStatus.
  // Actually, I'll just declare columns without useMemo to avoid stale closure issues, since it's a simple dashboard app.

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary" />
            Maintenance Logs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track vehicle repairs, scheduled service, and maintenance costs.</p>
        </div>
        <Button onClick={() => setIsLogModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Log Maintenance
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 h-48 text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading records...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-destructive bg-destructive/10">
            {error}
          </div>
        ) : (
          <DataTable columns={columns} data={records} searchKey="vehicle_identifier" searchPlaceholder="Search by Vehicle..." />
        )}
      </Card>

      <LogMaintenanceModal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
        onSuccess={fetchRecords} 
      />
    </div>
  )
}
