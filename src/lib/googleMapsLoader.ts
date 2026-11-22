declare global {
  interface Window {
  }
}

let loadPromise: Promise<typeof google> | null = null

export function googleMapsApiKey(): string | null {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (typeof key !== 'string') return null
  const trimmed = key.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function loadGoogleMaps(): Promise<typeof google> {
  const key = googleMapsApiKey()
  if (!key) {
    return Promise.reject(new Error('MISSING_API_KEY'))
  }

  if (typeof google !== 'undefined' && google.maps) {
    return Promise.resolve(google)
  }

  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const callbackName = '__cuddlesClubMapsReady'
    ;(window as unknown as Record<string, () => void>)[callbackName] = () => {
      if (typeof google !== 'undefined' && google.maps) {
        resolve(google)
        return
      }
      reject(new Error('GOOGLE_UNDEFINED'))
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="1"]')
    if (existing) {
      existing.addEventListener('load', () => {
        if (typeof google !== 'undefined' && google.maps) resolve(google)
      })
      existing.addEventListener('error', () => reject(new Error('LOAD_FAILED')))
      return
    }

    const script = document.createElement('script')
    script.dataset.googleMaps = '1'
    script.async = true
    script.defer = true
    script.onerror = () => reject(new Error('LOAD_FAILED'))
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=geometry&callback=${callbackName}`
    document.head.appendChild(script)
  })

  return loadPromise
}