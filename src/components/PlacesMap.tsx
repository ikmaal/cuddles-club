import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { FoodPlace, FoodPlaceStatus } from '../types'

const browser = L.Browser as {
  any3d: boolean
  webkit3d: boolean
  gecko3d: boolean
}

browser.any3d = false
browser.webkit3d = false
browser.gecko3d = false

const SINGAPORE: L.LatLngExpression = [1.3521, 103.8198]

export interface MapPreviewPin {
  lat: number
  lng: number
  status: FoodPlaceStatus
}

interface PlacesMapProps {
  places: FoodPlace[]
  selectedId: string | null
  onSelect: (id: string) => void
  preview?: MapPreviewPin | null
  interactive?: boolean
  flyTo?: { lat: number; lng: number } | null
}

function pinIcon(place: Pick<FoodPlace, 'name' | 'photoUrl' | 'status'>, selected: boolean) {
  const shortPhoto =
    place.photoUrl &&
    place.photoUrl.length < 700 &&
    (place.photoUrl.startsWith('http') || place.photoUrl.startsWith('blob:'))
  const safeUrl = shortPhoto ? place.photoUrl.replace(/["'\\]/g, '') : ''
  const face = safeUrl
    ? `<span class="places-pin__face" style="background-image:url(&quot;${safeUrl}&quot;)"></span>`
    : `<span class="places-pin__face is-letter">${(place.name[0] ?? '?').toUpperCase()}</span>`

  return L.divIcon({
    className: `places-pin places-pin--${place.status}${selected ? ' is-selected' : ''}`,
    html: `<span class="places-pin__heart">${face}</span>`,
    iconSize: [36, 42],
    iconAnchor: [18, 40],
  })
}

export function PlacesMap({
  places,
  selectedId,
  onSelect,
  preview = null,
  interactive = false,
  flyTo = null,
}: PlacesMapProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const fitKeyRef = useRef('')
  const flyKeyRef = useRef('')
  const interactiveRef = useRef(interactive)
  interactiveRef.current = interactive

  useEffect(() => {
    const host = hostRef.current
    if (!host || mapRef.current) return

    const enabled = interactiveRef.current
    const map = L.map(host, {
      zoomControl: false,
      attributionControl: true,
      dragging: enabled,
      scrollWheelZoom: enabled,
      doubleClickZoom: enabled,
      boxZoom: enabled,
      keyboard: enabled,
      touchZoom: enabled,
    }).setView(SINGAPORE, 12)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    const resize = () => map.invalidateSize()
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    window.setTimeout(resize, 80)
    window.addEventListener('resize', resize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', resize)
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (interactive) map.dragging.enable()
    else map.dragging.disable()
    if (interactive) map.touchZoom.enable()
    else map.touchZoom.disable()
    if (interactive) map.scrollWheelZoom.enable()
    else map.scrollWheelZoom.disable()
  }, [interactive])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !flyTo) return
    const key = `${flyTo.lat},${flyTo.lng}`
    if (key === flyKeyRef.current) return
    flyKeyRef.current = key
    map.setView([flyTo.lat, flyTo.lng], 15)
  }, [flyTo])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return

    layer.clearLayers()
    const withCoords = places.filter(
      (place) => typeof place.lat === 'number' && typeof place.lng === 'number',
    )

    for (const place of withCoords) {
      const marker = L.marker([place.lat as number, place.lng as number], {
        icon: pinIcon(place, place.id === selectedId),
        title: place.name,
      })
      marker.on('click', () => onSelect(place.id))
      marker.addTo(layer)
    }

    if (preview) {
      L.marker([preview.lat, preview.lng], {
        icon: pinIcon({ name: 'Pin', photoUrl: '', status: preview.status }, true),
        title: 'Pinned place',
      }).addTo(layer)
    }

    const fitKey = preview
      ? `preview:${preview.lat},${preview.lng}`
      : withCoords.map((place) => place.id).join('|')
    if (fitKey !== fitKeyRef.current) {
      fitKeyRef.current = fitKey
      if (preview) {
        map.setView([preview.lat, preview.lng], 16)
      } else if (withCoords.length === 1) {
        map.setView([withCoords[0].lat as number, withCoords[0].lng as number], 14)
      } else if (withCoords.length > 1) {
        const bounds = L.latLngBounds(
          withCoords.map((place) => [place.lat as number, place.lng as number] as L.LatLngTuple),
        )
        map.fitBounds(bounds.pad(0.18))
      } else {
        map.setView(SINGAPORE, 12)
      }
    } else {
      const selected = withCoords.find((place) => place.id === selectedId)
      if (selected) map.panTo([selected.lat as number, selected.lng as number])
    }

    window.setTimeout(() => map.invalidateSize(), 40)
  }, [onSelect, places, preview, selectedId])

  return (
    <div
      ref={hostRef}
      className={`places-map${interactive ? ' is-interactive' : ''}`}
      role="img"
      aria-label="Places map"
    />
  )
}
