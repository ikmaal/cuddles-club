import type { Place } from '../types'

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | undefined> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lng))
    url.searchParams.set('format', 'json')
    url.searchParams.set('zoom', '18')
    url.searchParams.set('addressdetails', '0')

    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
    })
    if (!res.ok) return undefined
    const data = (await res.json()) as { display_name?: string }
    return data.display_name
  } catch {
    return undefined
  }
}

export async function searchPlaces(
  query: string,
): Promise<Array<{ name: string; lat: number; lng: number; address: string }>> {
  const q = query.trim()
  if (q.length < 2) return []

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', q)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '5')
    url.searchParams.set('addressdetails', '0')

    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
    })
    if (!res.ok) return []
    const data = (await res.json()) as Array<{
      display_name: string
      lat: string
      lon: string
      name?: string
    }>

    return data.map((item) => ({
      name: item.name || item.display_name.split(',')[0] || 'Place',
      lat: Number(item.lat),
      lng: Number(item.lon),
      address: item.display_name,
    }))
  } catch {
    return []
  }
}

export function wouldReturnLabel(value: Place['wouldReturn']): string {
  if (value === 'yes') return 'Would return'
  if (value === 'maybe') return 'Maybe again'
  return 'One and done'
}
