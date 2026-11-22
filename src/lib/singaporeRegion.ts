import type { LatLng } from './geoguessrMath'
import regionsPayload from '../../regions.json'

export type SingaporeBounds = {
  north: number
  south: number
  east: number
  west: number
}

const singapore = regionsPayload.regions.singapore

/** Polygon vertices from regions.json — each point is [lat, lng]. */
export const SINGAPORE_POLYGON: LatLng[] = singapore.polygon.map(([lat, lng]) => ({
  lat,
  lng,
}))

export const SINGAPORE_BOUNDARY_COLOR = singapore.boundaryColor

function parseBbox(bbox: string): SingaporeBounds {
  const [west, south, east, north] = bbox.split(',').map((v) => Number.parseFloat(v))
  return { north, south, east, west }
}

export const SINGAPORE_BOUNDS: SingaporeBounds = parseBbox(singapore.bbox)

export const SINGAPORE_CENTER: LatLng = {
  lat: singapore.center[0],
  lng: singapore.center[1],
}

export function isInsideSingaporeBbox(point: LatLng): boolean {
  return (
    point.lat >= SINGAPORE_BOUNDS.south &&
    point.lat <= SINGAPORE_BOUNDS.north &&
    point.lng >= SINGAPORE_BOUNDS.west &&
    point.lng <= SINGAPORE_BOUNDS.east
  )
}

/** Ray-cast point-in-polygon on the Singapore boundary ring. */
export function isInsideSingaporePolygon(point: LatLng): boolean {
  if (!isInsideSingaporeBbox(point)) return false

  const { lat, lng } = point
  let inside = false

  for (let i = 0, j = SINGAPORE_POLYGON.length - 1; i < SINGAPORE_POLYGON.length; j = i++) {
    const yi = SINGAPORE_POLYGON[i].lat
    const xi = SINGAPORE_POLYGON[i].lng
    const yj = SINGAPORE_POLYGON[j].lat
    const xj = SINGAPORE_POLYGON[j].lng

    const intersects =
      (yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi

    if (intersects) inside = !inside
  }

  return inside
}

function clampToBbox(point: LatLng): LatLng {
  return {
    lat: Math.min(SINGAPORE_BOUNDS.north, Math.max(SINGAPORE_BOUNDS.south, point.lat)),
    lng: Math.min(SINGAPORE_BOUNDS.east, Math.max(SINGAPORE_BOUNDS.west, point.lng)),
  }
}

function distanceSquared(a: LatLng, b: LatLng): number {
  const dLat = a.lat - b.lat
  const dLng = a.lng - b.lng
  return dLat * dLat + dLng * dLng
}

function nearestOnSegment(point: LatLng, a: LatLng, b: LatLng): LatLng {
  const abLat = b.lat - a.lat
  const abLng = b.lng - a.lng
  const lenSq = abLat * abLat + abLng * abLng
  if (lenSq < 1e-18) return a

  let t = ((point.lat - a.lat) * abLat + (point.lng - a.lng) * abLng) / lenSq
  t = Math.max(0, Math.min(1, t))

  return {
    lat: a.lat + t * abLat,
    lng: a.lng + t * abLng,
  }
}

/** Snap outside points to the closest point on the Singapore polygon edge (map guesses). */
export function clampToSingaporePolygon(point: LatLng): LatLng {
  if (isInsideSingaporePolygon(point)) return point

  const inBox = clampToBbox(point)
  if (isInsideSingaporePolygon(inBox)) return inBox

  let best = SINGAPORE_CENTER
  let bestDist = Number.POSITIVE_INFINITY

  for (let i = 0; i < SINGAPORE_POLYGON.length; i++) {
    const a = SINGAPORE_POLYGON[i]
    const b = SINGAPORE_POLYGON[(i + 1) % SINGAPORE_POLYGON.length]
    const candidate = nearestOnSegment(inBox, a, b)
    const dist = distanceSquared(inBox, candidate)
    if (dist < bestDist) {
      bestDist = dist
      best = candidate
    }
  }

  return best
}

export function randomLatLngInSingapore(maxAttempts = 48): LatLng {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate: LatLng = {
      lat:
        SINGAPORE_BOUNDS.south +
        Math.random() * (SINGAPORE_BOUNDS.north - SINGAPORE_BOUNDS.south),
      lng:
        SINGAPORE_BOUNDS.west +
        Math.random() * (SINGAPORE_BOUNDS.east - SINGAPORE_BOUNDS.west),
    }
    if (isInsideSingaporePolygon(candidate)) return candidate
  }
  return SINGAPORE_CENTER
}