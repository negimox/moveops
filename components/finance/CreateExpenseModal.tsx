import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function CreateExpenseModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState<{id: number, vehicle_id: string, registration_no: string}[]>([])
  
  const [formData, setFormData] = useState({
    category: 'Toll',
    amount: '',
    vehicle_id: '',
    description: ''
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
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formData.category,
          amount: Number(formData.amount),
          vehicle_id: formData.vehicle_id ? Number(formData.vehicle_id) : null,
          description: formData.description
        })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      onSuccess()
      onClose()
      setFormData({ category: 'Toll', amount: '', vehicle_id: '', description: '' })
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
          <DialogTitle>Log Operational Expense</DialogTitle>
          <DialogDescription className="text-slate-400">
            Record a new expense (e.g., tolls, driver allowance, repairs).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Category</label>
              <select 
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 appearance-none"
              >
                <option value="Toll">Toll</option>
                <option value="Driver Allowance">Driver Allowance</option>
                <option value="Repair">Repair</option>
                <option value="Insurance">Insurance</option>
                <option value="Permit Fee">Permit Fee</option>
                <option value="Misc">Misc</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Amount (₹)</label>
              <input 
                type="number" step="0.01" min="1" required
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. 1500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Associated Vehicle (Optional)</label>
            <select 
              value={formData.vehicle_id}
              onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 appearance-none"
            >
              <option value="">None / General</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.vehicle_id} ({v.registration_no})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Description</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              placeholder="Provide details about the expense..."
              rows={3}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? 'Saving...' : 'Save Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
