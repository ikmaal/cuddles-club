export type LatLng = { lat: number; lng: number }

const EARTH_RADIUS_M = 6_371_000

/** Great-circle distance in metres (WGS84). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinHalf =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(sinHalf)))
}

/**
 * GeoGuessr-style score curve (0–5000 points).
 * @see https://geoguessr.fandom.com/wiki/Scoring
 */
export function scoreFromDistance(meters: number): number {
  if (meters <= 25) return 5000
  const points = 5000 * Math.E ** (-meters / 1492.706)
  return Math.max(0, Math.round(points))
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  const km = meters / 1000
  if (km < 10) return `${km.toFixed(2)} km`
  return `${km.toFixed(1)} km`
}