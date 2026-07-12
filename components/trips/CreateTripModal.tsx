'use client'

import { useState, useEffect, useRef } from 'react'
import { X, MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import dynamic from 'next/dynamic'

const RoutePreviewMap = dynamic(() => import('@/components/trips/RoutePreviewMap'), { ssr: false })

type CreateTripModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type Vehicle = {
  id: number
  vehicle_id: string
  type: string
  status: string
  capacity_kg: number
}

type Driver = {
  id: number
  name: string
  status: string
  license_verified: boolean
}

// ─── Autocomplete Component ───────────────────────────────────────────────
function LocationInput({ 
  name, 
  label, 
  placeholder,
  onSelect 
}: { 
  name: string, 
  label: string, 
  placeholder: string,
  onSelect?: (coords: { lat: number, lon: number, name: string } | null) => void 
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`)
        const data = await res.json()
        setResults(data)
        setIsOpen(true)
      } catch (e) {
        console.error(e)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="space-y-2 relative" ref={wrapperRef}>
      <label className="text-sm font-medium text-foreground">{label} *</label>
      <div className="relative">
        <Input 
          required 
          name={name} 
          placeholder={placeholder} 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (onSelect && e.target.value === '') onSelect(null)
          }}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
          className="pr-10"
        />
        <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute z-[9999] w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-popover-foreground hover:bg-muted focus:bg-muted focus:outline-none transition-colors border-b border-border last:border-0 truncate"
              onClick={() => {
                setQuery(r.display_name)
                setIsOpen(false)
                if (onSelect) {
                  onSelect({ lat: parseFloat(r.lat), lon: parseFloat(r.lon), name: r.display_name })
                }
              }}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
// ────────────────────────────────────────────────────────────────────────


export default function CreateTripModal({ isOpen, onClose, onSuccess }: CreateTripModalProps) {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
  
  const [originCoords, setOriginCoords] = useState<{ lat: number, lon: number } | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number, lon: number } | null>(null)

  useEffect(() => {
    if (isOpen) {
      setFetching(true)
      setSelectedVehicleId('')
      setOriginCoords(null)
      setDestinationCoords(null)
      Promise.all([
        fetch('/api/vehicles').then(r => r.json()),
        fetch('/api/drivers').then(r => r.json())
      ]).then(([vData, dData]) => {
        if (vData.vehicles) setVehicles(vData.vehicles.filter((v: Vehicle) => v.status === 'available'))
        if (dData.drivers) setDrivers(dData.drivers.filter((d: Driver) => d.status === 'available' && d.license_verified === true))
      }).catch(err => {
        console.error(err)
        setError('Failed to fetch available resources')
      }).finally(() => {
        setFetching(false)
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  const selectedVehicle = vehicles.find(v => v.id.toString() === selectedVehicleId)
  const maxCapacity = selectedVehicle ? selectedVehicle.capacity_kg : undefined

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const cargoWeight = parseFloat(formData.get('cargo_weight_kg') as string)

    if (!originCoords || !destinationCoords) {
      setError('Please select valid Origin and Destination locations from the dropdown suggestions.')
      setLoading(false)
      return
    }

    if (selectedVehicle && cargoWeight > selectedVehicle.capacity_kg) {
      setError(`Cargo weight cannot exceed the selected vehicle's capacity (${selectedVehicle.capacity_kg} kg)`)
      setLoading(false)
      return
    }
    
    const data = {
      vehicle_id: parseInt(formData.get('vehicle_id') as string, 10),
      driver_id: parseInt(formData.get('driver_id') as string, 10),
      origin: formData.get('origin'),
      destination: formData.get('destination'),
      cargo_weight_kg: cargoWeight,
      notes: formData.get('notes'),
    }

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Failed to create trip')
      
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
      <div className="bg-card border border-border rounded-xl shadow-2xl w-[90vw] max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Create New Trip</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          {fetching ? (
             <div className="flex justify-center p-8 text-muted-foreground">Loading resources...</div>
          ) : (
            <form id="create-trip-form" onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-5">
                <LocationInput 
                  name="origin" 
                  label="Origin" 
                  placeholder="e.g. Mumbai Warehouse" 
                  onSelect={(coords) => setOriginCoords(coords ? { lat: coords.lat, lon: coords.lon } : null)}
                />
                <LocationInput 
                  name="destination" 
                  label="Destination" 
                  placeholder="e.g. Pune City Center" 
                  onSelect={(coords) => setDestinationCoords(coords ? { lat: coords.lat, lon: coords.lon } : null)}
                />
              </div>

              {(originCoords || destinationCoords) && (
                <RoutePreviewMap origin={originCoords} destination={destinationCoords} />
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Assign Vehicle *</label>
                <select 
                  required 
                  name="vehicle_id" 
                  value={selectedVehicleId}
                  onChange={e => setSelectedVehicleId(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>Select Available Vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.vehicle_id} - {v.type} ({v.capacity_kg}kg)</option>
                  ))}
                </select>
                {vehicles.length === 0 && <p className="text-xs text-destructive">No available vehicles.</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Assign Driver *</label>
                <select required name="driver_id" defaultValue="" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="" disabled>Select Verified Driver</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {drivers.length === 0 && <p className="text-xs text-destructive">No available verified drivers.</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Cargo Weight (kg) * {maxCapacity ? `< Max: ${maxCapacity}kg` : ''}
                </label>
                <Input 
                  required 
                  type="number" 
                  step="0.1" 
                  name="cargo_weight_kg" 
                  placeholder="e.g. 1500" 
                  min="0" 
                  max={maxCapacity}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Notes</label>
                <Input name="notes" placeholder="Optional notes for the trip... (Max 500 characters)" maxLength={500} />
              </div>

            </form>
          )}
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
            form="create-trip-form"
            disabled={loading || fetching || vehicles.length === 0 || drivers.length === 0}
          >
            {loading ? 'Creating...' : 'Create & Dispatch'}
          </Button>
        </div>
      </div>
    </div>
  )
}
