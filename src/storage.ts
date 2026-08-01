import type { CoupleProfile } from './types'

const PROFILE_KEY = 'cuddles-club-profile-v1'
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
