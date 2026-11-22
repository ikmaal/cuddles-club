import { useEffect, useRef } from 'react'
import type { StreetViewRoundLocation } from '../../lib/singaporeGeoguess'

interface StreetViewPanoramaProps {
  maps: typeof google.maps
  location: StreetViewRoundLocation
  interactive: boolean
}

export function StreetViewPanorama({ maps, location, interactive }: StreetViewPanoramaProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const panorama = new maps.StreetViewPanorama(host, {
      position: { lat: location.lat, lng: location.lng },
      pano: location.panoId,
      pov: { heading: location.startHeading, pitch: 0 },
      zoom: 1,
      addressControl: false,
      showRoadLabels: false,
      fullscreenControl: false,
      motionTracking: false,
      motionTrackingControl: false,
      enableCloseButton: false,
      linksControl: interactive,
      panControl: interactive,
      zoomControl: interactive,
      clickToGo: interactive,
      scrollwheel: interactive,
      disableDefaultUI: false,
    })

    panoramaRef.current = panorama

    return () => {
      panoramaRef.current = null
    }
  }, [maps, location.lat, location.lng, location.panoId, location.startHeading])

  useEffect(() => {
    const panorama = panoramaRef.current
    if (!panorama) return
    panorama.setOptions({
      linksControl: interactive,
      panControl: interactive,
      zoomControl: interactive,
      clickToGo: interactive,
      scrollwheel: interactive,
    })
  }, [interactive])

  return <div ref={hostRef} className="sg-guess__street" aria-label="Street View" />
}