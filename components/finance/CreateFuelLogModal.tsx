import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function CreateFuelLogModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState<{id: number, vehicle_id: string, registration_no: string}[]>([])
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    liters: '',
    cost: '',
    odometer_km: '',
    fuel_type: 'Diesel',
    station: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetch('/api/vehicles')
        .then(res => res.json())
        .then(data => {
          if (data.vehicles) setVehicles(data.vehicles)
        })
        .catch(console.error)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/fuel-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: Number(formData.vehicle_id),
          liters: Number(formData.liters),
          cost: Number(formData.cost),
          odometer_km: formData.odometer_km ? Number(formData.odometer_km) : null,
          fuel_type: formData.fuel_type,
          station: formData.station
        })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      onSuccess()
      onClose()
      setFormData({ vehicle_id: '', liters: '', cost: '', odometer_km: '', fuel_type: 'Diesel', station: '' })
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Log Fuel Fill-up</DialogTitle>
          <DialogDescription className="text-slate-400">
            Record a new fuel transaction for a vehicle.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Vehicle</label>
            <select 
              required
              value={formData.vehicle_id}
              onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 appearance-none"
            >
              <option value="" disabled>Select Vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.vehicle_id} ({v.registration_no})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Liters</label>
              <input 
                type="number" step="0.01" min="0.1" required
                value={formData.liters}
                onChange={(e) => setFormData({...formData, liters: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. 45.5"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Total Cost (₹)</label>
              <input 
                type="number" step="0.01" min="1" required
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. 4000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Odometer (km)</label>
              <input 
                type="number" min="0"
                value={formData.odometer_km}
                onChange={(e) => setFormData({...formData, odometer_km: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Fuel Type</label>
              <select 
                value={formData.fuel_type}
                onChange={(e) => setFormData({...formData, fuel_type: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 appearance-none"
              >
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="CNG">CNG</option>
                <option value="EV">EV Charge</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Station / Location</label>
            <input 
              type="text"
              value={formData.station}
              onChange={(e) => setFormData({...formData, station: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Shell Pump, Andheri"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? 'Saving...' : 'Save Fuel Log'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
