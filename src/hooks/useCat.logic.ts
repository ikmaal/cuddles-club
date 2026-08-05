import type { CatMood, CatState } from '../types'
import { XP_PER_LEVEL } from '../types'

const HOUR = 3_600_000

const DRAIN = {
  fullness: 9,
  happiness: 7,
  energy: 6,
  cleanliness: 4,
}

export { XP_PER_LEVEL }

export const defaultCat: CatState = {
  name: 'Mochi',
  fullness: 70,
  happiness: 80,
  energy: 75,
  cleanliness: 85,
  sleeping: false,
  xp: 0,
  careYou: 0,
  carePartner: 0,
  bestScore: 0,
  activeCarer: 'you',
  updatedAt: Date.now(),
  lastPettedAt: 0,
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value))
}

export function applyDecay(cat: CatState, now: number): CatState {
  const hours = (now - cat.updatedAt) / HOUR
  if (!Number.isFinite(hours) || hours <= 0.0004) return cat

  const asleep = cat.sleeping
  const next: CatState = {
    ...cat,
    fullness: clamp(cat.fullness - hours * (asleep ? 4 : DRAIN.fullness)),
    happiness: clamp(cat.happiness - hours * (asleep ? 3 : DRAIN.happiness)),
    energy: clamp(
      asleep ? cat.energy + hours * 22 : cat.energy - hours * DRAIN.energy,
    ),
    cleanliness: clamp(cat.cleanliness - hours * DRAIN.cleanliness),
    updatedAt: now,
  }

  if (asleep && next.energy >= 100) next.sleeping = false
  return next
}

export function catLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

export function catMood(cat: CatState): CatMood {
  if (cat.sleeping) return 'sleeping'
  if (cat.fullness < 25) return 'hungry'
  if (cat.cleanliness < 25) return 'messy'
  if (cat.energy < 20) return 'sleepy'
  if (cat.happiness < 35) return 'sad'
  if (cat.happiness > 70 && cat.fullness > 55) return 'happy'
  return 'content'
}

export interface CareResult {
  message: string
  gainedXp: number
}
