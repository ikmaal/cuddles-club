export interface CoupleProfile {
  nameYou: string
  namePartner: string
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
