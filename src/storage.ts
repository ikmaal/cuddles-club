import { defaultPersonProfile, normalizePerson } from './lib/personProfile'
import type { CoupleProfile } from './types'

const PROFILE_KEY = 'cuddles-club-profile-v1'
const LEGACY_PROFILE_KEY = 'spoonful-profile-v1'

export const defaultProfile: CoupleProfile = {
  nameYou: 'You',
  namePartner: 'Partner',
  since: '',
  you: defaultPersonProfile(),
  partner: defaultPersonProfile(),
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

export function normalizeCoupleProfile(input?: Partial<CoupleProfile> | null): CoupleProfile {
  return {
    nameYou: (input?.nameYou ?? defaultProfile.nameYou).trim().slice(0, 18) || 'You',
    namePartner: (input?.namePartner ?? defaultProfile.namePartner).trim().slice(0, 18) || 'Partner',
    since: typeof input?.since === 'string' ? input.since : '',
    you: normalizePerson(input?.you),
    partner: normalizePerson(input?.partner),
  }
}

export function loadProfile(): CoupleProfile {
  const current = readJson<Partial<CoupleProfile>>(PROFILE_KEY)
  if (current) return normalizeCoupleProfile(current)

  const legacy = readJson<Partial<CoupleProfile>>(LEGACY_PROFILE_KEY)
  if (legacy) {
    const migrated = normalizeCoupleProfile(legacy)
    localStorage.setItem(PROFILE_KEY, JSON.stringify(migrated))
    return migrated
  }

  return normalizeCoupleProfile()
}

export function saveProfile(profile: CoupleProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(normalizeCoupleProfile(profile)))
}
