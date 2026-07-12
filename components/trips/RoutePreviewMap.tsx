'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'

import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

// Fix missing icons in nextjs/webpack manually
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: typeof markerIcon === 'string' ? markerIcon : (markerIcon as any)?.src,
  iconRetinaUrl: typeof markerIcon2x === 'string' ? markerIcon2x : (markerIcon2x as any)?.src,
  shadowUrl: typeof markerShadow === 'string' ? markerShadow : (markerShadow as any)?.src,
})

import 'leaflet-routing-machine'

type RoutePreviewMapProps = {
  origin: { lat: number, lon: number } | null
  destination: { lat: number, lon: number } | null
}

function RoutingMachine({ origin, destination }: RoutePreviewMapProps) {
  const map = useMap()
  const routingControlRef = useRef<L.Routing.Control | null>(null)

  useEffect(() => {
    if (!map) return

    // Clean up existing routing control if any
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current)
      routingControlRef.current = null
    }

    if (origin && destination) {
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(origin.lat, origin.lon),
          L.latLng(destination.lat, destination.lon)
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        lineOptions: {
          styles: [{ color: '#3b82f6', weight: 4, opacity: 0.8 }],
          extendToWaypoints: true,
          missingRouteTolerance: 0
        }
      }).addTo(map)

      routingControlRef.current = routingControl
    } else if (origin) {
      map.setView([origin.lat, origin.lon], 13)
    } else if (destination) {
      map.setView([destination.lat, destination.lon], 13)
    }

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current)
      }
    }
  }, [map, origin, destination])

  return null
}

export default function RoutePreviewMap({ origin, destination }: RoutePreviewMapProps) {
  // Default center (India roughly)
  const defaultCenter: [number, number] = [20.5937, 78.9629]
  const defaultZoom = 5

  return (
    <div className="w-full h-[350px] rounded-lg overflow-hidden border border-border mt-4">
      <MapContainer
        center={origin ? [origin.lat, origin.lon] : defaultCenter}
        zoom={origin ? 13 : defaultZoom}
        style={{ height: '100%', width: '100%', zIndex: 10 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RoutingMachine origin={origin} destination={destination} />
      </MapContainer>
    </div>
  )
}
