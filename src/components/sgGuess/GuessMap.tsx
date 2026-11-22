import { useCallback, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { LatLng } from '../../lib/geoguessrMath'
import {
  clampToSingaporeBounds,
  isInsideSingaporeBounds,
  SINGAPORE_BOUNDS,
  SINGAPORE_BOUNDARY_COLOR,
  SINGAPORE_POLYGON,
} from '../../lib/singaporeGeoguess'

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const SINGAPORE_MAP_BOUNDS = L.latLngBounds(
  [SINGAPORE_BOUNDS.south, SINGAPORE_BOUNDS.west],
  [SINGAPORE_BOUNDS.north, SINGAPORE_BOUNDS.east],
)

const SINGAPORE_POLYGON_LATLNGS = SINGAPORE_POLYGON.map((p) => [p.lat, p.lng] as L.LatLngTuple)

const SINGAPORE_POLYGON_BOUNDS = L.latLngBounds(SINGAPORE_POLYGON_LATLNGS)

const MAP_FRAME_PADDING: L.PointExpression = [10, 10]

function addBaseTileLayer(map: L.Map): L.TileLayer {
  const cartoKey = (import.meta.env.VITE_CARTO_API_KEY as string | undefined)?.trim()
  const voyagerUrl = cartoKey
    ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoKey)}`
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

  return L.tileLayer(voyagerUrl, {
    attribution: `${OSM_ATTRIBUTION}, &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    subdomains: 'abcd',
    maxZoom: 18,
    minZoom: 1,
  }).addTo(map)
}

function guessIcon(kind: 'guess' | 'answer') {
  const color = kind === 'guess' ? '#e74c3c' : '#27ae60'
  return L.divIcon({
    className: `sg-guess-pin sg-guess-pin--${kind}`,
    html: `<span class="sg-guess-pin__dot" style="--pin-color:${color}"></span>`,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
  })
}

function frameSingaporeOnly(map: L.Map): number {
  map.fitBounds(SINGAPORE_POLYGON_BOUNDS, {
    padding: MAP_FRAME_PADDING,
    animate: false,
    maxZoom: 15,
  })
  const zoom = map.getZoom()
  map.setMinZoom(zoom)
  map.setMaxBounds(SINGAPORE_MAP_BOUNDS)
  return zoom
}

interface GuessMapProps {
  mode: 'pick' | 'reveal'
  guess: LatLng | null
  answer: LatLng | null
  onPick?: (coords: LatLng) => void
}

export function GuessMap({ mode, guess, answer, onPick }: GuessMapProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const overlayRef = useRef<L.LayerGroup | null>(null)
  const frameRef = useRef<L.Polygon | null>(null)
  const minFrameZoomRef = useRef(11)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick

  const refreshSize = useCallback(() => {
    mapRef.current?.invalidateSize({ animate: false })
  }, [])

  const refitSingaporeFrame = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    minFrameZoomRef.current = frameSingaporeOnly(map)
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host || mapRef.current) return

    const map = L.map(host, {
      zoomControl: false,
      attributionControl: true,
      maxBounds: SINGAPORE_MAP_BOUNDS,
      maxBoundsViscosity: 1,
    })

    addBaseTileLayer(map)
    overlayRef.current = L.layerGroup().addTo(map)

    frameRef.current = L.polygon(SINGAPORE_POLYGON_LATLNGS, {
      color: SINGAPORE_BOUNDARY_COLOR,
      weight: 2,
      opacity: 0.85,
      fillColor: 'rgba(61, 214, 140, 0.08)',
      fillOpacity: 1,
      interactive: false,
    }).addTo(map)

    minFrameZoomRef.current = frameSingaporeOnly(map)

    map.on('click', (event: L.LeafletMouseEvent) => {
      if (mode !== 'pick' || !onPickRef.current) return
      if (!isInsideSingaporeBounds(event.latlng)) return
      onPickRef.current(clampToSingaporeBounds(event.latlng))
    })

    mapRef.current = map

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        refreshSize()
        if (!guess && !answer) refitSingaporeFrame()
      })
    })
    observer.observe(host)
    requestAnimationFrame(refreshSize)

    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
      overlayRef.current = null
      frameRef.current = null
    }
  }, [mode, refitSingaporeFrame, refreshSize])

  useEffect(() => {
    const map = mapRef.current
    const overlay = overlayRef.current
    if (!map || !overlay) return

    overlay.clearLayers()

    if (guess) {
      L.marker([guess.lat, guess.lng], {
        icon: guessIcon('guess'),
        zIndexOffset: 1000,
      }).addTo(overlay)
    }

    if (answer) {
      L.marker([answer.lat, answer.lng], {
        icon: guessIcon('answer'),
        zIndexOffset: 1100,
      }).addTo(overlay)
    }

    const minZoom = minFrameZoomRef.current

    if (guess && answer) {
      L.polyline(
        [
          [guess.lat, guess.lng],
          [answer.lat, answer.lng],
        ],
        {
          color: '#f4d03f',
          weight: 3,
          opacity: 0.9,
          dashArray: '6 8',
        },
      ).addTo(overlay)

      const bounds = L.latLngBounds([guess.lat, guess.lng], [answer.lat, answer.lng])
      map.fitBounds(bounds.pad(0.25), { animate: true, maxZoom: 15 })
      if (map.getZoom() < minZoom) {
        map.setZoom(minZoom)
        map.panTo(bounds.getCenter(), { animate: true })
      }
    } else if (guess) {
      const targetZoom = Math.max(minZoom, 13)
      map.flyTo([guess.lat, guess.lng], targetZoom, { animate: true, duration: 0.4 })
    } else {
      refitSingaporeFrame()
    }
  }, [guess, answer, refitSingaporeFrame])

  useEffect(() => {
    const t = window.setTimeout(() => {
      refreshSize()
      if (!guess && !answer) refitSingaporeFrame()
    }, 80)
    return () => window.clearTimeout(t)
  }, [answer, guess, mode, refitSingaporeFrame, refreshSize])

  return <div ref={hostRef} className="sg-guess__map-host" role="application" aria-label="Singapore guess map" />
}