export interface GeocodeHit {
  id: string
  label: string
  area: string
  address: string
  lat: number
  lng: number
  category?: string
}

export interface SearchPlacesOptions {
  /** Bias results toward this point (defaults to central Singapore). */
  lat?: number
  lng?: number
}

const DEFAULT_BIAS = { lat: 1.3521, lng: 103.8198 }

/** Approximate Singapore bounding box for filtering non-SG results. */
const SINGAPORE_BOUNDS = {
  minLat: 1.13,
  maxLat: 1.49,
  minLng: 103.6,
  maxLng: 104.1,
}

export function isInSingapore(lat: number, lng: number): boolean {
  return (
    lat >= SINGAPORE_BOUNDS.minLat &&
    lat <= SINGAPORE_BOUNDS.maxLat &&
    lng >= SINGAPORE_BOUNDS.minLng &&
    lng <= SINGAPORE_BOUNDS.maxLng
  )
}

function singaporeQuery(query: string): string {
  if (/singapore/i.test(query)) return query
  return `${query}, Singapore`
}

const FOOD_OSM_TAGS = [
  'amenity:restaurant',
  'amenity:cafe',
  'amenity:fast_food',
  'amenity:bar',
  'amenity:food_court',
  'amenity:ice_cream',
  'amenity:biergarten',
  'shop:bakery',
  'shop:confectionery',
  'shop:tea',
  'shop:deli',
] as const

const NOMINATIM_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'CuddlesClub/1.0 (couple food places app)',
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] }
  properties?: {
    osm_type?: string
    osm_id?: number
    osm_key?: string
    osm_value?: string
    name?: string
    street?: string
    housenumber?: string
    locality?: string
    district?: string
    city?: string
    state?: string
    country?: string
    postcode?: string
    countrycode?: string
  }
}

interface NominatimHit {
  place_id?: number
  display_name?: string
  lat?: string
  lon?: string
  name?: string
  type?: string
  class?: string
  address?: {
    road?: string
    suburb?: string
    neighbourhood?: string
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    country?: string
    postcode?: string
  }
}

function formatFoodCategory(osmKey?: string, osmValue?: string): string | undefined {
  if (!osmKey || !osmValue) return undefined
  if (osmKey === 'amenity') {
    const labels: Record<string, string> = {
      restaurant: 'Restaurant',
      cafe: 'Cafe',
      fast_food: 'Fast food',
      bar: 'Bar',
      food_court: 'Food court',
      ice_cream: 'Dessert',
      biergarten: 'Bar',
    }
    return labels[osmValue]
  }
  if (osmKey === 'shop') {
    const labels: Record<string, string> = {
      bakery: 'Bakery',
      confectionery: 'Dessert',
      tea: 'Cafe',
      deli: 'Deli',
    }
    return labels[osmValue]
  }
  return undefined
}

function buildAddress(parts: Array<string | undefined>): string {
  return parts.filter((part): part is string => Boolean(part?.trim())).join(', ')
}

function photonToHit(feature: PhotonFeature): GeocodeHit | null {
  const coords = feature.geometry?.coordinates
  const props = feature.properties
  if (!coords || !props) return null

  const [lng, lat] = coords
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const name = props.name?.trim()
  const streetLine = buildAddress([props.housenumber, props.street].filter(Boolean) as string[])
  const area =
    props.locality?.trim() ||
    props.district?.trim() ||
    props.city?.trim() ||
    props.state?.trim() ||
    ''
  const label = name || streetLine || area
  if (!label) return null

  const address = buildAddress([
    name && streetLine ? `${name}, ${streetLine}` : name || streetLine,
    area,
    props.city,
    props.state,
    props.country,
    props.postcode,
  ])

  const osmId = props.osm_id != null ? `${props.osm_type ?? 'n'}/${props.osm_id}` : `${lat},${lng}`

  const hit: GeocodeHit = {
    id: `photon:${osmId}`,
    label,
    area,
    address,
    lat,
    lng,
    category: formatFoodCategory(props.osm_key, props.osm_value),
  }

  if (props.countrycode?.toUpperCase() !== 'SG' && !isInSingapore(lat, lng)) return null
  return hit
}

function nominatimToHit(row: NominatimHit): GeocodeHit | null {
  const lat = Number(row.lat)
  const lng = Number(row.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const area =
    row.address?.suburb ||
    row.address?.neighbourhood ||
    row.address?.city ||
    row.address?.town ||
    row.address?.village ||
    row.address?.county ||
    ''
  const label = row.name?.trim() || row.display_name?.split(',')[0]?.trim() || ''
  if (!label) return null

  const category =
    row.class === 'amenity' || row.class === 'shop'
      ? formatFoodCategory(row.class, row.type)
      : undefined

  const country = row.address?.country?.toLowerCase() ?? ''
  if (country && !country.includes('singapore') && !isInSingapore(lat, lng)) return null

  return {
    id: `nominatim:${row.place_id ?? `${lat},${lng}`}`,
    label,
    area,
    address: row.display_name || label,
    lat,
    lng,
    category,
  }
}

function hitKey(hit: GeocodeHit): string {
  const lat = hit.lat.toFixed(4)
  const lng = hit.lng.toFixed(4)
  const name = hit.label.toLowerCase().replace(/\s+/g, ' ').trim()
  return `${name}|${lat}|${lng}`
}

function relevanceScore(hit: GeocodeHit, query: string, bias: { lat: number; lng: number }): number {
  const q = query.toLowerCase()
  const name = hit.label.toLowerCase()
  let score = 0

  if (name === q) score += 120
  else if (name.startsWith(q)) score += 90
  else if (name.includes(q)) score += 60
  else if (q.split(/\s+/).every((word) => name.includes(word))) score += 40

  if (hit.category) score += 25
  if (hit.address.toLowerCase().includes('singapore')) score += 10

  const dLat = hit.lat - bias.lat
  const dLng = hit.lng - bias.lng
  const distance = Math.sqrt(dLat * dLat + dLng * dLng)
  score += Math.max(0, 30 - distance * 40)

  return score
}

function dedupeAndRank(hits: GeocodeHit[], query: string, bias: { lat: number; lng: number }): GeocodeHit[] {
  const seen = new Set<string>()
  const unique: GeocodeHit[] = []

  for (const hit of hits) {
    if (!isInSingapore(hit.lat, hit.lng)) continue
    const key = hitKey(hit)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(hit)
  }

  return unique
    .sort((a, b) => relevanceScore(b, query, bias) - relevanceScore(a, query, bias))
    .slice(0, 8)
}

async function searchPhoton(
  query: string,
  bias: { lat: number; lng: number },
  foodOnly: boolean,
): Promise<GeocodeHit[]> {
  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', singaporeQuery(query))
  url.searchParams.set('limit', '10')
  url.searchParams.set('lang', 'en')
  url.searchParams.set('lat', String(bias.lat))
  url.searchParams.set('lon', String(bias.lng))

  if (foodOnly) {
    for (const tag of FOOD_OSM_TAGS) {
      url.searchParams.append('osm_tag', tag)
    }
  }

  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!response.ok) return []

  const body = (await response.json()) as { features?: PhotonFeature[] }
  return (body.features ?? [])
    .map(photonToHit)
    .filter((hit): hit is GeocodeHit => Boolean(hit))
}

async function searchNominatim(query: string, bias: { lat: number; lng: number }): Promise<GeocodeHit[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('q', singaporeQuery(query))
  url.searchParams.set('limit', '6')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('countrycodes', 'sg')
  url.searchParams.set('dedupe', '1')
  url.searchParams.set('viewbox', '103.6,1.49,104.1,1.13')
  url.searchParams.set('bounded', '1')
  url.searchParams.set('lat', String(bias.lat))
  url.searchParams.set('lon', String(bias.lng))

  const response = await fetch(url.toString(), { headers: NOMINATIM_HEADERS })
  if (!response.ok) return []

  const rows = (await response.json()) as NominatimHit[]
  return rows
    .map(nominatimToHit)
    .filter((hit): hit is GeocodeHit => Boolean(hit))
}

export async function searchPlaces(
  query: string,
  options: SearchPlacesOptions = {},
): Promise<GeocodeHit[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const bias = {
    lat: options.lat ?? DEFAULT_BIAS.lat,
    lng: options.lng ?? DEFAULT_BIAS.lng,
  }

  const [foodHits, broadHits, nominatimHits] = await Promise.all([
    searchPhoton(trimmed, bias, true),
    searchPhoton(trimmed, bias, false),
    searchNominatim(trimmed, bias),
  ])

  return dedupeAndRank([...foodHits, ...broadHits, ...nominatimHits], trimmed, bias)
}
