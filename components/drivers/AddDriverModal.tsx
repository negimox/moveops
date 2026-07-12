'use client'

import { useState } from 'react'
import { X, UserPlus, FileText, CheckCircle2 } from 'lucide-react'

type AddDriverModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddDriverModal({ isOpen, onClose, onSuccess }: AddDriverModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // State for step 1 submission
  const [driverId, setDriverId] = useState<number | null>(null)
  const [licenseId, setLicenseId] = useState('')

  if (!isOpen) return null

  // Step 1: Register Driver Details
  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const submittedLicense = formData.get('license_id') as string
    setLicenseId(submittedLicense)

    const data = {
      name: formData.get('name'),
      contact: formData.get('contact'),
      category: formData.get('category'),
      license_id: submittedLicense,
    }

    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Failed to register driver')
      
      setDriverId(result.driver.id)
      setStep(2) // move to verify step
      onSuccess() // refresh list in background to show pending driver
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify License with Setu API
  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!driverId) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/drivers/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, licenseNo: licenseId }),
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Verification failed')
      
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleModalClose = () => {
    setStep(1)
    setDriverId(null)
    setLicenseId('')
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
              {step === 1 ? <UserPlus className="w-5 h-5 text-indigo-400" /> : <FileText className="w-5 h-5 text-indigo-400" />}
            </div>
            <h2 className="text-lg font-semibold text-white">
              {step === 1 ? 'Register New Driver' : 'Verify Driving License'}
            </h2>
          </div>
          <button onClick={handleModalClose} className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
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
              
              <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Note:</span> Registering a driver will place them in <span className="text-amber-400">Pending Approval</span>. The Fleet Manager must approve them before they can be dispatched on trips.
                </p>
              </div>
            </form>
          )}

          {step === 2 && (
            <form id="verify-form" onSubmit={handleVerify} className="space-y-5">
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <h3 className="text-indigo-100 font-medium">Driver Registered Successfully!</h3>
                <p className="text-sm text-indigo-300/80 mt-1">Now, verify their Driving License using DigiLocker</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">License Number to Verify</label>
                <input 
                  disabled 
                  value={licenseId} 
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-400 cursor-not-allowed uppercase" 
                />
              </div>

              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 flex flex-col gap-2">
                <p className="text-xs text-slate-400 leading-relaxed">
                  By clicking verify, we will contact the Setu DigiLocker API to fetch the verified document details for the provided license number. The data will be stored securely.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
          {step === 1 && (
            <>
              <button type="button" onClick={handleModalClose} className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-transparent border border-slate-700 hover:bg-slate-800 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" form="driver-form" disabled={loading} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-lg shadow-indigo-500/20 transition-all">
                {loading ? 'Saving...' : 'Register Driver'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button type="button" onClick={handleModalClose} disabled={loading} className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-transparent border border-slate-700 hover:bg-slate-800 rounded-lg transition-colors">
                Skip for now
              </button>
              <button type="submit" form="verify-form" disabled={loading} className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {loading ? 'Verifying with Setu...' : 'Verify License'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
