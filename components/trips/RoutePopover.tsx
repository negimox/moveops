'use client'

import { useEffect, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import RoutePreviewMap with SSR disabled
const RoutePreviewMap = dynamic(() => import('./RoutePreviewMap'), { ssr: false })

type Coords = { lat: number, lon: number }

type RoutePopoverProps = {
  originName: string
  destinationName: string
}

export default function RoutePopover({ originName, destinationName }: RoutePopoverProps) {
  const [origin, setOrigin] = useState<Coords | null>(null)
  const [destination, setDestination] = useState<Coords | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const geocode = async (query: string): Promise<Coords | null> => {
      try {
        let res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`)
        let data = res.ok ? await res.json() : []
        if (data && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
        }
        
        // Fallback: Split by em-dash or regular dash to just search the city part
        const fallbackQuery = query.split(/—|-/)[0].trim()
        if (fallbackQuery !== query) {
          res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fallbackQuery)}&format=json&limit=1`)
          data = res.ok ? await res.json() : []
          if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
          }
        }
        return null
      } catch (err) {
        return null
      }
    }

    const fetchCoords = async () => {
      setLoading(true)
      const [origCoords, destCoords] = await Promise.all([
        geocode(originName),
        geocode(destinationName)
      ])

      if (isMounted) {
        if (!origCoords || !destCoords) {
          setError('Could not locate exact coordinates for this route.')
        } else {
          setOrigin(origCoords)
          setDestination(destCoords)
        }
        setLoading(false)
      }
    }

    fetchCoords()

    return () => {
      isMounted = false
    }
  }, [originName, destinationName])

  return (
    <div className="w-[350px] space-y-3">
      <h4 className="font-medium flex items-center gap-2 text-sm">
        <MapPin className="w-4 h-4 text-blue-500" />
        Route Map Preview
      </h4>
      
      <div className="text-xs text-muted-foreground flex flex-col gap-1">
        <div><strong>Origin:</strong> {originName}</div>
        <div><strong>Destination:</strong> {destinationName}</div>
      </div>

      <div className="mt-2 min-h-[200px] border border-border rounded-lg relative overflow-hidden flex items-center justify-center bg-muted/20">
        {loading ? (
          <div className="flex flex-col items-center text-muted-foreground gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs">Locating route...</span>
          </div>
        ) : error ? (
          <div className="text-xs text-destructive text-center p-4">
            {error}
          </div>
        ) : (
          <div className="absolute inset-0 [&>div]:mt-0 [&>div]:h-full [&>div]:border-0">
            <RoutePreviewMap origin={origin} destination={destination} />
          </div>
        )}
      </div>
    </div>
  )
}
