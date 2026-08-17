export interface GeocodeHit {
  label: string
  area: string
  address: string
  lat: number
  lng: number
}

interface NominatimHit {
  display_name?: string
  lat?: string
  lon?: string
  name?: string
  address?: {
    suburb?: string
    neighbourhood?: string
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    country?: string
  }
}

export async function searchPlaces(query: string): Promise<GeocodeHit[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('q', trimmed)
  url.searchParams.set('limit', '5')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('countrycodes', 'sg,my')
  url.searchParams.set('viewbox', '103.0,1.15,104.15,1.55')
  url.searchParams.set('bounded', '0')

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error('Could not search the map')

  const rows = (await response.json()) as NominatimHit[]
  return rows
    .map((row) => {
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
      return {
        label: row.name || row.display_name || trimmed,
        area,
        address: row.display_name || '',
        lat,
        lng,
      } satisfies GeocodeHit
    })
    .filter((hit): hit is GeocodeHit => Boolean(hit))
}
