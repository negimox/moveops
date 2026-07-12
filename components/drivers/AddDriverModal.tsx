'use client'

import { useState } from 'react'
import { X, UserPlus } from 'lucide-react'

type AddDriverModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddDriverModal({ isOpen, onClose, onSuccess }: AddDriverModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    const data = {
      name: formData.get('name'),
      contact: formData.get('contact'),
      category: formData.get('category'),
      license_id: formData.get('license_id'),
    }

    try {
      const initRes = await fetch('/api/drivers/verify-license/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // no driverId yet
      })
      const initData = await initRes.json()

      if (!initRes.ok) throw new Error(initData.error || 'Failed to initiate verification')

      // Save pending driver data and request ID to localStorage
      localStorage.setItem('setu_request_id', initData.id)
      localStorage.setItem('setu_new_driver_data', JSON.stringify(data))

      // Redirect to Setu for DigiLocker verification
      window.location.href = initData.url
      
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleModalClose = () => {
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <UserPlus className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Register & Verify Driver
            </h2>
          </div>
          <button onClick={handleModalClose} className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form id="driver-form" onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Full Name *</label>
              <input required name="name" placeholder="e.g. Ramesh Kumar" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Contact Number *</label>
              <input required name="contact" placeholder="+91-9876543210" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">License Number *</label>
                <input required name="license_id" placeholder="MH12AB1234" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 uppercase transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Vehicle Category *</label>
                <select required name="category" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none">
                  <option value="LMV">LMV (Light Motor)</option>
                  <option value="HMV">HMV (Heavy Motor)</option>
                  <option value="HPMV">HPMV (Heavy Passenger)</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 flex flex-col gap-2">
              <p className="text-xs text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-300">Note:</span> We will contact the Setu DigiLocker API to verify this driver's license before they are added to the system.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
          <button type="button" onClick={handleModalClose} disabled={loading} className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-transparent border border-slate-700 hover:bg-slate-800 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" form="driver-form" disabled={loading} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-lg shadow-indigo-500/20 transition-all">
            {loading ? 'Verifying & Saving...' : 'Register Driver'}
          </button>
        </div>
      </div>
    </div>
  )
}
