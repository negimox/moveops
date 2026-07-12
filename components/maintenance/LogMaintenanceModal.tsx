'use client'

import { useState, useEffect } from 'react'
import { X, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Vehicle = {
  id: number
  vehicle_id: string
  type: string
  status: string
}

type LogMaintenanceModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function LogMaintenanceModal({ isOpen, onClose, onSuccess }: LogMaintenanceModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  useEffect(() => {
    if (isOpen) {
      fetch('/api/vehicles')
        .then(res => res.json())
        .then(data => {
          if (data.vehicles) {
            // Show all vehicles except those currently on an active trip
            setVehicles(data.vehicles.filter((v: Vehicle) => v.status !== 'on_trip'))
          }
        })
        .catch(console.error)
    }
  }, [isOpen])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    const data = {
      vehicle_id: parseInt(formData.get('vehicle_id') as string, 10),
      description: formData.get('description') as string,
      cost: parseFloat(formData.get('cost') as string),
      status: formData.get('status') as string,
      date: formData.get('date') as string,
    }

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Failed to log maintenance')
      
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Log Maintenance</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <form id="log-maintenance-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Vehicle *</label>
              {/* Info banner */}
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
                <span className="mt-0.5">⚠️</span>
                <span>Adding a vehicle to maintenance will automatically set its status to <strong>In Shop</strong>, removing it from active trip assignments.</span>
              </div>
              <select required name="vehicle_id" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <option value="">Select a vehicle...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_id} ({v.type}){v.status === 'in_shop' ? ' — Already In Shop' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Service Type / Description *</label>
              <Input required name="description" placeholder="e.g. Oil Change, Brake Pad Replacement" />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Cost (₹) *</label>
                <Input required type="number" step="0.01" name="cost" placeholder="2500" min="0" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Service Date *</label>
                <Input required type="date" name="date" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status *</label>
              <select required name="status" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="log-maintenance-form"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Record'}
          </Button>
        </div>
      </div>
    </div>
  )
}
