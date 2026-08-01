import type { CoupleProfile, Place } from './types'

const PLACES_KEY = 'cuddles-club-places-v1'
const PROFILE_KEY = 'cuddles-club-profile-v1'
const LEGACY_PLACES_KEY = 'spoonful-places-v1'
const LEGACY_PROFILE_KEY = 'spoonful-profile-v1'

export const defaultProfile: CoupleProfile = {
  nameYou: 'You',
  namePartner: 'Partner',
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function loadPlaces(): Place[] {
  const current = readJson<Place[]>(PLACES_KEY)
  if (Array.isArray(current)) return current

  const legacy = readJson<Place[]>(LEGACY_PLACES_KEY)
  if (Array.isArray(legacy)) {
    localStorage.setItem(PLACES_KEY, JSON.stringify(legacy))
    return legacy
  }

  return []
}

export function savePlaces(places: Place[]): void {
  localStorage.setItem(PLACES_KEY, JSON.stringify(places))
}

export function loadProfile(): CoupleProfile {
  const current = readJson<CoupleProfile>(PROFILE_KEY)
  if (current) return { ...defaultProfile, ...current }

  const legacy = readJson<CoupleProfile>(LEGACY_PROFILE_KEY)
  if (legacy) {
    const migrated = { ...defaultProfile, ...legacy }
    localStorage.setItem(PROFILE_KEY, JSON.stringify(migrated))
    return migrated
  }

  return { ...defaultProfile }
}

export function saveProfile(profile: CoupleProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function averageRating(place: Place): number {
  return (place.ratingYou + place.ratingPartner) / 2
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
