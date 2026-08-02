export interface CoupleProfile {
  nameYou: string
  namePartner: string
  /** ISO date the two of you got together. Powers the days-together counter. */
  since: string
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

export type Screen =
  | 'home'
  | 'cat'
  | 'notes'
  | 'bucket'
  | 'roulette'
  | 'countdown'
  | 'question'
  | 'mood'
  | 'us'

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
