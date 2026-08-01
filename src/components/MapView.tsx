import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { averageRating } from '../storage'
import { DEFAULT_CENTER, DEFAULT_ZOOM, type Place } from '../types'
import 'leaflet/dist/leaflet.css'

function createPinIcon(selected: boolean) {
  const size = selected ? 44 : 36
  return L.divIcon({
    className: 'cuddles-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 4],
    popupAnchor: [0, -size + 8],
    html: `
      <div class="pin ${selected ? 'pin--selected' : ''}">
        <svg width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M24 44c-7.2-5.8-16-13.2-16-21.6C8 14.2 13.6 10 19.2 10c3 0 5.3 1.4 4.8 3.8C23.5 11.4 25.8 10 28.8 10 34.4 10 40 14.2 40 22.4 40 30.8 31.2 38.2 24 44z" fill="${selected ? '#C44569' : '#E85D75'}"/>
          <circle cx="24" cy="21" r="5.5" fill="#FFE4EA"/>
          <path d="M24 18.2c.9 0 1.6.7 1.6 1.6v.4h1.1c.5 0 .9.4.9.9s-.4.9-.9.9h-1.1v1.8c0 .5-.4.9-.9.9s-.9-.4-.9-.9v-1.8h-1.1c-.5 0-.9-.4-.9-.9s.4-.9.9-.9h1.1v-.4c0-.9.7-1.6 1.6-1.6z" fill="#E85D75"/>
        </svg>
      </div>
    `,
  })
}

function MapSizer() {
  const map = useMap()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize()
    }, 80)
    return () => window.clearTimeout(timer)
  }, [map])

  return null
}

function FitBounds({
  places,
  focusId,
}: {
  places: Place[]
  focusId: string | null
}) {
  const map = useMap()

  useEffect(() => {
    if (focusId) {
      const focused = places.find((p) => p.id === focusId)
      if (focused) {
        map.flyTo([focused.lat, focused.lng], Math.max(map.getZoom(), 15), {
          duration: 0.7,
        })
      }
      return
    }

    if (places.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
      return
    }

    if (places.length === 1) {
      map.setView([places[0].lat, places[0].lng], 14)
      return
    }

    const bounds = L.latLngBounds(
      places.map((place) => [place.lat, place.lng] as [number, number]),
    )
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 })
  }, [places, focusId, map])

  return null
}

function MapClickHandler({
  enabled,
  onPick,
}: {
  enabled: boolean
  onPick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface MapViewProps {
  places: Place[]
  selectedId: string | null
  onSelect: (id: string) => void
  pickMode?: boolean
  pickLatLng?: { lat: number; lng: number } | null
  onPick?: (lat: number, lng: number) => void
}

export function MapView({
  places,
  selectedId,
  onSelect,
  pickMode = false,
  pickLatLng = null,
  onPick,
}: MapViewProps) {
  const selectedIcon = useMemo(() => createPinIcon(true), [])
  const defaultIcon = useMemo(() => createPinIcon(false), [])
  const pickIcon = useMemo(() => createPinIcon(true), [])

  return (
    <div className={`map-shell ${pickMode ? 'map-shell--pick' : ''}`}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="map-canvas"
        zoomControl={false}
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapSizer />
        <FitBounds places={pickMode ? [] : places} focusId={pickMode ? null : selectedId} />
        <MapClickHandler
          enabled={pickMode}
          onPick={(lat, lng) => onPick?.(lat, lng)}
        />

        {!pickMode &&
          places.map((place) => (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={place.id === selectedId ? selectedIcon : defaultIcon}
              eventHandlers={{
                click: () => onSelect(place.id),
              }}
              title={`${place.name} · ${averageRating(place).toFixed(1)}★`}
            />
          ))}

        {pickMode && pickLatLng ? (
          <Marker position={[pickLatLng.lat, pickLatLng.lng]} icon={pickIcon} />
        ) : null}
      </MapContainer>

      {pickMode ? (
        <div className="map-hint" role="status">
          Tap the map to drop your pin
        </div>
      ) : null}
    </div>
  )
}
