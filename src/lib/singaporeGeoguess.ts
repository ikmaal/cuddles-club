import type { LatLng } from './geoguessrMath'
import { isInsideSingaporePolygon, randomLatLngInSingapore } from './singaporeRegion'

export const SG_GUESS_ROUND_COUNT = 5
export const SG_GUESS_ROUND_SECONDS = 180

export {
  clampToSingaporePolygon as clampToSingaporeBounds,
  isInsideSingaporePolygon as isInsideSingaporeBounds,
  SINGAPORE_BOUNDS,
  SINGAPORE_CENTER,
  SINGAPORE_BOUNDARY_COLOR,
  SINGAPORE_POLYGON,
} from './singaporeRegion'

/** Known outdoor pano neighbourhoods — fallback when random probes miss coverage. */
export const SINGAPORE_STREET_VIEW_SEEDS: LatLng[] = [
  { lat: 1.2849, lng: 103.8543 },
  { lat: 1.3022, lng: 103.8585 },
  { lat: 1.3048, lng: 103.8318 },
  { lat: 1.3187, lng: 103.8454 },
  { lat: 1.3354, lng: 103.7427 },
  { lat: 1.3483, lng: 103.6831 },
  { lat: 1.3966, lng: 103.8753 },
  { lat: 1.4382, lng: 103.7891 },
  { lat: 1.4294, lng: 103.8354 },
  { lat: 1.3402, lng: 103.9628 },
  { lat: 1.3721, lng: 103.8954 },
  { lat: 1.2656, lng: 103.8222 },
  { lat: 1.2553, lng: 103.8238 },
  { lat: 1.2805, lng: 103.8442 },
  { lat: 1.2915, lng: 103.8634 },
  { lat: 1.3138, lng: 103.7651 },
  { lat: 1.3343, lng: 103.8565 },
  { lat: 1.3541, lng: 103.9448 },
  { lat: 1.3915, lng: 103.9889 },
  { lat: 1.2494, lng: 103.8303 },
  { lat: 1.3818, lng: 103.7649 },
  { lat: 1.4032, lng: 103.9076 },
  { lat: 1.3239, lng: 103.9302 },
  { lat: 1.2754, lng: 103.7991 },
  { lat: 1.4366, lng: 103.7863 },
  { lat: 1.2996, lng: 103.7876 },
  { lat: 1.3567, lng: 103.8729 },
  { lat: 1.3201, lng: 103.7068 },
  { lat: 1.3656, lng: 103.7084 },
  { lat: 1.2834, lng: 103.8092 },
].filter(isInsideSingaporePolygon)

export type StreetViewRoundLocation = LatLng & {
  panoId?: string
  startHeading: number
}

function shuffledSeeds(): LatLng[] {
  const list = [...SINGAPORE_STREET_VIEW_SEEDS]
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

function getPanorama(
  maps: typeof google.maps,
  service: google.maps.StreetViewService,
  location: LatLng,
): Promise<google.maps.StreetViewPanoramaData | null> {
  return new Promise((resolve) => {
    service.getPanorama(
      {
        location,
        radius: 800,
        source: maps.StreetViewSource.OUTDOOR,
      },
      (data, status) => {
        if (status !== maps.StreetViewStatus.OK || !data?.location?.latLng) {
          resolve(null)
          return
        }
        resolve(data)
      },
    )
  })
}

function panoramaToRoundLocation(
  data: google.maps.StreetViewPanoramaData,
): StreetViewRoundLocation | null {
  const latLng = data.location?.latLng
  if (!latLng) return null

  const answer: LatLng = { lat: latLng.lat(), lng: latLng.lng() }
  if (!isInsideSingaporePolygon(answer)) return null

  return {
    ...answer,
    panoId: data.location?.pano,
    startHeading: Math.floor(Math.random() * 360),
  }
}

export async function findSingaporeStreetViewRound(
  maps: typeof google.maps,
): Promise<StreetViewRoundLocation> {
  const service = new maps.StreetViewService()
  const probes: LatLng[] = [
    ...Array.from({ length: 12 }, () => randomLatLngInSingapore()),
    ...shuffledSeeds().slice(0, 8),
  ].filter(isInsideSingaporePolygon)

  for (const probe of probes) {
    const data = await getPanorama(maps, service, probe)
    if (!data) continue
    const round = panoramaToRoundLocation(data)
    if (round) return round
  }

  throw new Error('NO_COVERAGE')
}