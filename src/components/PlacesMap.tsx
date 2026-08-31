import { useCallback, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { FoodPlace, FoodPlaceStatus } from '../types'

const SINGAPORE: L.LatLngExpression = [1.3521, 103.8198]

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

function addBaseTileLayer(map: L.Map): L.TileLayer {
  const cartoKey = (import.meta.env.VITE_CARTO_API_KEY as string | undefined)?.trim()
  const voyagerUrl = cartoKey
    ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoKey)}`
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

  return L.tileLayer(voyagerUrl, {
    attribution: `${OSM_ATTRIBUTION}, &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    subdomains: 'abcd',
    maxZoom: 20,
    updateWhenIdle: true,
    updateWhenZooming: false,
    keepBuffer: 3,
  }).addTo(map)
}

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
  active?: boolean
  /** When this value changes, the map smoothly fits visible markers. */
  autoFitKey?: string
  flyTo?: { lat: number; lng: number; token?: number } | null
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

function mapPadding(host: HTMLElement | null): {
  paddingTopLeft: L.PointExpression
  paddingBottomRight: L.PointExpression
} {
  const height = host?.clientHeight ?? 640
  return {
    paddingTopLeft: [56, 20],
    paddingBottomRight: [Math.round(height * 0.48) + 20, 20],
  }
}

export function PlacesMap({
  places,
  selectedId,
  onSelect,
  preview = null,
  interactive = false,
  active = true,
  autoFitKey = '',
  flyTo = null,
}: PlacesMapProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const previewRef = useRef<L.Marker | null>(null)
  const fitKeyRef = useRef('')
  const flyKeyRef = useRef('')
  const onSelectRef = useRef(onSelect)
  const interactiveRef = useRef(interactive)
  onSelectRef.current = onSelect
  interactiveRef.current = interactive

  const refreshMapSize = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    map.invalidateSize({ animate: false, pan: false })
  }, [])

  useEffect(() => {
    return () => {
      const map = mapRef.current
      if (!map) return
      map.remove()
      mapRef.current = null
      layerRef.current = null
      markersRef.current.clear()
      previewRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!active) return

    const host = hostRef.current
    if (!host) return

    if (mapRef.current) {
      requestAnimationFrame(refreshMapSize)
      window.setTimeout(refreshMapSize, 120)
      window.setTimeout(refreshMapSize, 320)
      return
    }

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
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: false,
      inertia: true,
      inertiaDeceleration: 2800,
      worldCopyJump: false,
    }).setView(SINGAPORE, 12)

    addBaseTileLayer(map)

    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    let resizeTimer = 0
    const resize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(refreshMapSize, 120)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(host)
    window.addEventListener('resize', resize)
    requestAnimationFrame(refreshMapSize)
    window.setTimeout(refreshMapSize, 150)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', resize)
      window.clearTimeout(resizeTimer)
    }
  }, [active, refreshMapSize])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const enabled = interactive
    const toggle = (handler: L.Handler, on: boolean) => {
      if (on) handler.enable()
      else handler.disable()
    }

    toggle(map.dragging, enabled)
    toggle(map.touchZoom, enabled)
    toggle(map.scrollWheelZoom, enabled)
    toggle(map.doubleClickZoom, enabled)
    toggle(map.boxZoom, enabled)
    toggle(map.keyboard, enabled)
  }, [interactive])

  const fitToPlaces = useCallback(
    (targetPlaces: FoodPlace[], animate: boolean) => {
      const map = mapRef.current
      const host = hostRef.current
      if (!map) return

      const padding = mapPadding(host)
      const withCoords = targetPlaces.filter(
        (place) => typeof place.lat === 'number' && typeof place.lng === 'number',
      )

      if (preview) {
        map.flyTo([preview.lat, preview.lng], 16, {
          animate,
          duration: 0.65,
          ...padding,
        })
        return
      }

      if (withCoords.length === 0) {
        map.flyTo(SINGAPORE, 12, { animate, duration: 0.65, ...padding })
        return
      }

      if (withCoords.length === 1) {
        const place = withCoords[0]
        map.flyTo([place.lat as number, place.lng as number], 14, {
          animate,
          duration: 0.65,
          ...padding,
        })
        return
      }

      const bounds = L.latLngBounds(
        withCoords.map((place) => [place.lat as number, place.lng as number] as L.LatLngTuple),
      )
      map.flyToBounds(bounds.pad(0.16), {
        animate,
        duration: 0.75,
        maxZoom: 15,
        ...padding,
      })
    },
    [preview],
  )

  useEffect(() => {
    const map = mapRef.current
    if (!map || !flyTo) return
    const key = `${flyTo.lat},${flyTo.lng},${flyTo.token ?? 0}`
    if (key === flyKeyRef.current) return
    flyKeyRef.current = key

    map.flyTo([flyTo.lat, flyTo.lng], 15, {
      animate: true,
      duration: 0.75,
      ...mapPadding(hostRef.current),
    })
  }, [flyTo])

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return

    const withCoords = places.filter(
      (place) => typeof place.lat === 'number' && typeof place.lng === 'number',
    )
    const nextIds = new Set(withCoords.map((place) => place.id))

    for (const [id, marker] of markersRef.current) {
      if (nextIds.has(id)) continue
      layer.removeLayer(marker)
      markersRef.current.delete(id)
    }

    for (const place of withCoords) {
      const latlng: L.LatLngExpression = [place.lat as number, place.lng as number]
      const selected = place.id === selectedId
      const existing = markersRef.current.get(place.id)

      if (existing) {
        existing.setLatLng(latlng)
        existing.setIcon(pinIcon(place, selected))
        existing.setZIndexOffset(selected ? 1000 : 0)
        continue
      }

      const marker = L.marker(latlng, {
        icon: pinIcon(place, selected),
        title: place.name,
        zIndexOffset: selected ? 1000 : 0,
      })
      marker.on('click', () => onSelectRef.current(place.id))
      marker.addTo(layer)
      markersRef.current.set(place.id, marker)
    }

    if (preview) {
      if (!previewRef.current) {
        previewRef.current = L.marker([preview.lat, preview.lng], {
          icon: pinIcon({ name: 'Pin', photoUrl: '', status: preview.status }, true),
          title: 'Pinned place',
          zIndexOffset: 1200,
        })
        previewRef.current.addTo(layer)
      } else {
        previewRef.current.setLatLng([preview.lat, preview.lng])
      }
    } else if (previewRef.current) {
      layer.removeLayer(previewRef.current)
      previewRef.current = null
    }

    const selected = withCoords.find((place) => place.id === selectedId)
    if (selected && fitKeyRef.current) {
      mapRef.current?.panTo([selected.lat as number, selected.lng as number], {
        animate: true,
        duration: 0.35,
      })
    }
  }, [places, preview, selectedId])

  useEffect(() => {
    if (!active || !mapRef.current) return
    const key = preview ? `preview:${preview.lat},${preview.lng}` : autoFitKey
    if (key === fitKeyRef.current) return
    fitKeyRef.current = key
    window.setTimeout(() => fitToPlaces(places, true), 80)
  }, [active, autoFitKey, fitToPlaces, places, preview])

  return (
    <div
      ref={hostRef}
      className={`places-map${interactive ? ' is-interactive' : ''}${active ? ' is-active' : ''}`}
      role="img"
      aria-label="Places map"
      aria-hidden={!active}
    />
  )
}
