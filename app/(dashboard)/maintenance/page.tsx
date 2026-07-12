'use client'

import { useEffect, useState, useMemo } from 'react'
import { Wrench, Plus, CheckCircle2, Clock, Calendar, ArrowUpDown, Pen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import LogMaintenanceModal from '@/components/maintenance/LogMaintenanceModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'

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
  const [confirmStatus, setConfirmStatus] = useState<{ id: number, newStatus: string } | null>(null)

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

  const executeStatusUpdate = async () => {
    if (!confirmStatus) return
    const { id, newStatus } = confirmStatus
    
    try {
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        fetchRecords()
        setConfirmStatus(null)
      }
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
                onClick={() => setConfirmStatus({ id: r.id, newStatus: 'in_progress' })} 
                className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 h-8 px-2"
              >
                Start
              </Button>
            )}
            {r.status === 'in_progress' && (
              <Button 
                variant="ghost" 
                onClick={() => setConfirmStatus({ id: r.id, newStatus: 'completed' })} 
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
            <Badge variant="secondary" className="ml-2 bg-indigo-500/10 text-indigo-400 gap-1.5"><Pen className="w-3.5 h-3.5"/> Editor</Badge>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track vehicle repairs, scheduled service, and maintenance costs.</p>
        </div>
        <Button onClick={() => setIsLogModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Log Maintenance
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Wrench className="w-4 h-4 text-primary" /></div>
              Total Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{new Set(records.map(r => r.vehicle_identifier)).size}</p>
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
            <p className="text-2xl font-bold">{records.filter(r => r.status === 'scheduled').length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Clock className="w-4 h-4 text-blue-500" /></div>
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{records.filter(r => r.status === 'in_progress').length}</p>
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
            <p className="text-2xl font-bold">{records.filter(r => r.status === 'completed').length}</p>
          </CardContent>
        </Card>
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

      <Dialog open={!!confirmStatus} onOpenChange={(open) => { if (!open) setConfirmStatus(null) }}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Status Update</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to mark this maintenance record as {confirmStatus?.newStatus.replace('_', ' ')}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setConfirmStatus(null)} className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800">
              Cancel
            </Button>
            <Button onClick={executeStatusUpdate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
