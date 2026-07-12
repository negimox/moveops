'use client'

import { useState, useMemo } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type CompleteTripModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tripId: number | null
  avgCostPerKm: string | null
}

export default function CompleteTripModal({ isOpen, onClose, onSuccess, tripId, avgCostPerKm }: CompleteTripModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [distanceStr, setDistanceStr] = useState<string>('')
  
  const distance = parseFloat(distanceStr) || 0
  const costPerKm = parseFloat(avgCostPerKm || '0')
  
  const estimatedCost = distance * costPerKm
  const calculatedRevenue = estimatedCost * 1.35 // 35% markup for revenue/price

  if (!isOpen || tripId === null) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (distance <= 0) {
      setError('Distance must be greater than 0')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          distance_km: distance,
          revenue: calculatedRevenue
        }),
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Failed to complete trip')
      
      onSuccess()
      onClose()
      setDistanceStr('')
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
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Complete Trip</h2>
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

          <form id="complete-trip-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Actual Distance Travelled (km) *</label>
              <Input 
                required 
                type="number" 
                step="0.1" 
                min="0"
                value={distanceStr}
                onChange={e => setDistanceStr(e.target.value)}
                placeholder="e.g. 150.5" 
              />
            </div>

            <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Calculated Financials</h3>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Vehicle Cost Rate:</span>
                <span className="font-mono">₹{costPerKm.toFixed(2)} / km</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Estimated Trip Cost:</span>
                <span className="font-mono text-amber-500">₹{estimatedCost.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm font-semibold pt-2 border-t border-border">
                <span className="text-foreground">Final Revenue (35% Markup):</span>
                <span className="font-mono text-emerald-500 text-lg">₹{calculatedRevenue.toFixed(2)}</span>
              </div>
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
            form="complete-trip-form"
            disabled={loading || distance <= 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? 'Processing...' : 'Mark as Completed'}
          </Button>
        </div>
      </div>
    </div>
  )
}
