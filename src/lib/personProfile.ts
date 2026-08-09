import type { PersonProfile } from '../types'

export const defaultPersonProfile = (): PersonProfile => ({
  photo: '',
  birthday: '',
  favoriteColor: '',
  nickname: '',
  loveLanguage: '',
  favoriteFood: '',
  hometown: '',
  bio: '',
})

export const LOVE_LANGUAGES = [
  'Words of Affirmation',
  'Quality Time',
  'Acts of Service',
  'Receiving Gifts',
  'Physical Touch',
] as const

export const COLOR_PRESETS = [
  '#e85d75',
  '#f76708',
  '#ffd933',
  '#17b5a6',
  '#136fd8',
  '#d194ff',
  '#fad0c4',
  '#272d88',
  '#1a1a1a',
] as const

export type PersonDetailsPayload = Omit<PersonProfile, 'photo'>

export function normalizePerson(input?: Partial<PersonProfile> | null): PersonProfile {
  const base = defaultPersonProfile()
  if (!input || typeof input !== 'object') return base
  return {
    photo: typeof input.photo === 'string' ? input.photo : '',
    birthday: typeof input.birthday === 'string' ? input.birthday.slice(0, 10) : '',
    favoriteColor: normalizeHex(input.favoriteColor),
    nickname: typeof input.nickname === 'string' ? input.nickname.trim().slice(0, 24) : '',
    loveLanguage: typeof input.loveLanguage === 'string' ? input.loveLanguage.trim().slice(0, 40) : '',
    favoriteFood: typeof input.favoriteFood === 'string' ? input.favoriteFood.trim().slice(0, 40) : '',
    hometown: typeof input.hometown === 'string' ? input.hometown.trim().slice(0, 40) : '',
    bio: typeof input.bio === 'string' ? input.bio.trim().slice(0, 160) : '',
  }
}

export function personDetailsOnly(person: PersonProfile): PersonDetailsPayload {
  const { photo: _photo, ...details } = normalizePerson(person)
  return details
}

export function detailsFromJson(raw: unknown): PersonDetailsPayload {
  if (!raw || typeof raw !== 'object') return personDetailsOnly(defaultPersonProfile())
  return personDetailsOnly(normalizePerson(raw as Partial<PersonProfile>))
}

function normalizeHex(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase()
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`
  return ''
}

export function formatBirthday(birthday: string): string | null {
  if (!birthday) return null
  const date = new Date(`${birthday}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function zodiacFromBirthday(birthday: string): string | null {
  if (!birthday) return null
  const date = new Date(`${birthday}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  const month = date.getMonth() + 1
  const day = date.getDate()

  const signs: [number, number, string][] = [
    [1, 19, 'Capricorn'],
    [2, 18, 'Aquarius'],
    [3, 20, 'Pisces'],
    [4, 19, 'Aries'],
    [5, 20, 'Taurus'],
    [6, 20, 'Gemini'],
    [7, 22, 'Cancer'],
    [8, 22, 'Leo'],
    [9, 22, 'Virgo'],
    [10, 22, 'Libra'],
    [11, 21, 'Scorpio'],
    [12, 21, 'Sagittarius'],
  ]

  for (const [m, d, sign] of signs) {
    if (month === m && day <= d) return sign
  }
  if (month === 12) return 'Capricorn'
  const next = signs.find(([m]) => m === month + 1)
  return next?.[2] ?? 'Capricorn'
}

export function ageFromBirthday(birthday: string): number | null {
  if (!birthday) return null
  const birth = new Date(`${birthday}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  if (beforeBirthday) age -= 1
  return age >= 0 && age < 130 ? age : null
}
