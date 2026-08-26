export interface PersonProfile {
  /** Data URL locally, or public storage URL when cloud-synced. */
  photo: string
  /** ISO date YYYY-MM-DD */
  birthday: string
  /** Hex color, e.g. #e85d75 */
  favoriteColor: string
  loveLanguage: string
  favoriteFood: string
  favoriteDrink: string
  favoriteMovie: string
  hometown: string
  /** Short fun fact */
  bio: string
}

export interface CoupleProfile {
  nameYou: string
  namePartner: string
  /** ISO date the two of you got together. Powers the days-together counter. */
  since: string
  you: PersonProfile
  partner: PersonProfile
}

export type Carer = 'you' | 'partner'

export type CatMood =
  | 'happy'
  | 'content'
  | 'hungry'
  | 'sleepy'
  | 'messy'
  | 'sad'
  | 'sleeping'

export interface CatState {
  name: string
  fullness: number
  happiness: number
  energy: number
  cleanliness: number
  sleeping: boolean
  xp: number
  careYou: number
  carePartner: number
  bestScore: number
  activeCarer: Carer
  updatedAt: number
  lastPettedAt: number
}

export const XP_PER_LEVEL = 100

export type Screen = 'home' | 'strips' | 'us' | 'academics' | 'places' | 'pooptracker'

export interface PoopLog {
  id: string
  owner: Carer
  createdAt: number
}

export interface Photostrip {
  id: string
  title: string
  /** Compressed JPEG data URL for the strip face. */
  image: string
  createdAt: number
}

export type AcademicMaterialKind = 'lecture' | 'tutorial' | 'assignment' | 'notes'

export const MODULE_COLORS = [
  { id: 'butter', label: 'Butter', swatch: '#f8e7a8' },
  { id: 'peach', label: 'Peach', swatch: '#f8d4c4' },
  { id: 'rose', label: 'Rose', swatch: '#f5c6d8' },
  { id: 'lilac', label: 'Lilac', swatch: '#e4d4f8' },
  { id: 'sky', label: 'Sky', swatch: '#cde8f8' },
  { id: 'mint', label: 'Mint', swatch: '#c8ead8' },
] as const

export type ModuleColor = (typeof MODULE_COLORS)[number]['id']
export const DEFAULT_MODULE_COLOR: ModuleColor = 'butter'

export function parseModuleColor(value: unknown, fallbackId = ''): ModuleColor {
  if (typeof value === 'string' && MODULE_COLORS.some((item) => item.id === value)) {
    return value as ModuleColor
  }
  if (!fallbackId) return DEFAULT_MODULE_COLOR
  let sum = 0
  for (const char of fallbackId) sum += char.charCodeAt(0)
  return MODULE_COLORS[sum % MODULE_COLORS.length].id
}

export interface AcademicModule {
  id: string
  /** Viewer-relative owner: your courses vs partner's. */
  owner: Carer
  /** Short code e.g. CS101 */
  code: string
  title: string
  /** Optional term label e.g. Sem 1 2026 */
  term: string
  color: ModuleColor
  createdAt: number
}

export interface AcademicMaterial {
  id: string
  moduleId: string
  kind: AcademicMaterialKind
  title: string
  /** ISO date YYYY-MM-DD when set */
  dueDate: string
  notes: string
  fileName: string
  /** Public URL (cloud) or object URL / data URL (local). */
  fileUrl: string
  /** Cloud storage path when synced. */
  storagePath: string
  extractedText: string
  done: boolean
  createdAt: number
}

export type FoodPlaceStatus = 'been' | 'want'

export interface FoodPlace {
  id: string
  name: string
  status: FoodPlaceStatus
  area: string
  cuisine: string
  address: string
  notes: string
  /** 0 means unrated */
  rating: number
  lat: number | null
  lng: number | null
  photoUrl: string
  storagePath: string
  visitedAt: string
  createdAt: number
}

export interface BoothPosePhoto {
  id: string
  /** Data URL locally, or public storage URL when cloud-synced. */
  image: string
  createdAt: number
}

export interface CustomStripFrame {
  id: string
  label: string
  /** Full-bleed strip artwork used as the booth frame background. */
  image: string
  createdAt: number
}

export interface Note {
  id: string
  text: string
  author: Carer
  createdAt: number
}

export interface BucketItem {
  id: string
  text: string
  done: boolean
  createdAt: number
  doneAt?: number
}

export interface DateIdea {
  id: string
  text: string
}

export interface Countdown {
  id: string
  label: string
  date: string
  repeatsYearly: boolean
}

export type MoodKey = 'great' | 'good' | 'okay' | 'low' | 'rough'

export interface MoodEntry {
  /** YYYY-MM-DD */
  day: string
  you?: MoodKey
  partner?: MoodKey
}

export interface AnswerEntry {
  id: string
  question: string
  you: string
  partner: string
  answeredAt: number
}

export interface ListeningStatus {
  slot: 'a' | 'b'
  spotifyUserId: string | null
  displayName: string
  trackId: string | null
  trackName: string | null
  artists: string | null
  albumName: string | null
  albumArtUrl: string | null
  trackUrl: string | null
  isPlaying: boolean
  updatedAt: number
}

export interface ListeningCard {
  who: 'you' | 'partner'
  name: string
  trackName: string | null
  artists: string | null
  albumArtUrl: string | null
  trackUrl: string | null
  isPlaying: boolean
  updatedAt: number
  connected: boolean
}
