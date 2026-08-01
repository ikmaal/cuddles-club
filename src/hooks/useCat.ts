import { useCallback, useEffect, useRef, useState } from 'react'
import type { CatMood, CatState, Carer } from '../types'
import { XP_PER_LEVEL } from '../types'

const CAT_KEY = 'cuddles-club-cat-v1'
const HOUR = 3_600_000

// Per-hour drain while the cat is awake. Sleeping slows hunger and mood loss
// and refills energy instead.
const DRAIN = {
  fullness: 9,
  happiness: 7,
  energy: 6,
  cleanliness: 4,
}

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

function loadCat(): CatState {
  try {
    const raw = localStorage.getItem(CAT_KEY)
    if (!raw) return { ...defaultCat }
    const parsed = JSON.parse(raw) as Partial<CatState>
    return applyDecay({ ...defaultCat, ...parsed }, Date.now())
  } catch {
    return { ...defaultCat }
  }
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

export function useCat() {
  const [cat, setCat] = useState<CatState>(() => loadCat())
  const ready = useRef(false)

  useEffect(() => {
    ready.current = true
  }, [])

  useEffect(() => {
    if (!ready.current) return
    localStorage.setItem(CAT_KEY, JSON.stringify(cat))
  }, [cat])

  useEffect(() => {
    const id = window.setInterval(() => {
      setCat((prev) => applyDecay(prev, Date.now()))
    }, 20_000)
    return () => window.clearInterval(id)
  }, [])

  const award = useCallback((prev: CatState, xp: number): CatState => {
    const carerKey = prev.activeCarer === 'you' ? 'careYou' : 'carePartner'
    return {
      ...prev,
      xp: prev.xp + xp,
      [carerKey]: prev[carerKey] + 1,
      updatedAt: Date.now(),
    }
  }, [])

  const feed = useCallback((): CareResult => {
    let result: CareResult = { message: '', gainedXp: 0 }

    setCat((prev) => {
      const now = Date.now()
      const base = applyDecay(prev, now)

      if (base.sleeping) {
        result = { message: `${base.name} is fast asleep`, gainedXp: 0 }
        return base
      }
      if (base.fullness > 92) {
        result = { message: `${base.name} is too full for more`, gainedXp: 0 }
        return base
      }

      result = { message: `${base.name} devoured the bowl`, gainedXp: 8 }
      return award(
        {
          ...base,
          fullness: clamp(base.fullness + 28),
          happiness: clamp(base.happiness + 4),
          cleanliness: clamp(base.cleanliness - 3),
        },
        8,
      )
    })

    return result
  }, [award])

  const groom = useCallback((): CareResult => {
    let result: CareResult = { message: '', gainedXp: 0 }

    setCat((prev) => {
      const now = Date.now()
      const base = applyDecay(prev, now)

      if (base.cleanliness > 92) {
        result = { message: `${base.name} is already spotless`, gainedXp: 0 }
        return base
      }

      result = { message: `${base.name} looks fluffy again`, gainedXp: 8 }
      return award(
        {
          ...base,
          cleanliness: clamp(base.cleanliness + 34),
          happiness: clamp(base.happiness + 5),
          energy: clamp(base.energy - 3),
        },
        8,
      )
    })

    return result
  }, [award])

  const pet = useCallback((): CareResult => {
    let result: CareResult = { message: '', gainedXp: 0 }

    setCat((prev) => {
      const now = Date.now()
      const base = applyDecay(prev, now)

      // Rapid taps still animate, but only count every few seconds
      if (now - base.lastPettedAt < 4000) {
        return { ...base, happiness: clamp(base.happiness + 1) }
      }

      result = { message: `${base.name} purrs`, gainedXp: 3 }
      return award(
        {
          ...base,
          happiness: clamp(base.happiness + 7),
          lastPettedAt: now,
        },
        3,
      )
    })

    return result
  }, [award])

  const toggleSleep = useCallback((): CareResult => {
    let result: CareResult = { message: '', gainedXp: 0 }

    setCat((prev) => {
      const base = applyDecay(prev, Date.now())
      const sleeping = !base.sleeping
      result = {
        message: sleeping
          ? `${base.name} curled up for a nap`
          : `${base.name} woke up`,
        gainedXp: 0,
      }
      return { ...base, sleeping, updatedAt: Date.now() }
    })

    return result
  }, [])

  const finishPlay = useCallback(
    (score: number): CareResult => {
      let result: CareResult = { message: '', gainedXp: 0 }

      setCat((prev) => {
        const base = applyDecay(prev, Date.now())
        const xp = Math.max(5, score * 2)

        result = {
          message: `${base.name} caught ${score} ${score === 1 ? 'time' : 'times'}`,
          gainedXp: xp,
        }

        return award(
          {
            ...base,
            happiness: clamp(base.happiness + Math.min(32, 8 + score * 1.6)),
            energy: clamp(base.energy - 12),
            fullness: clamp(base.fullness - 6),
            cleanliness: clamp(base.cleanliness - 4),
            bestScore: Math.max(base.bestScore, score),
            sleeping: false,
          },
          xp,
        )
      })

      return result
    },
    [award],
  )

  const setCarer = useCallback((carer: Carer) => {
    setCat((prev) => ({ ...prev, activeCarer: carer }))
  }, [])

  const rename = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 18)
    if (!trimmed) return
    setCat((prev) => ({ ...prev, name: trimmed }))
  }, [])

  return {
    cat,
    mood: catMood(cat),
    level: catLevel(cat.xp),
    feed,
    groom,
    pet,
    toggleSleep,
    finishPlay,
    setCarer,
    rename,
  }
}
