import { useCallback } from 'react'
import { useCouple } from '../context/CoupleContext'
import { applyDecay, catLevel, catMood } from './useCat.logic'

export { applyDecay, catLevel, catMood, defaultCat, XP_PER_LEVEL } from './useCat.logic'
export type { CareResult } from './useCat.logic'

export function useCat() {
  const { cat, setCat } = useCouple()

  const award = useCallback((prev: typeof cat, xp: number) => {
    const carerKey = prev.activeCarer === 'you' ? 'careYou' : 'carePartner'
    return {
      ...prev,
      xp: prev.xp + xp,
      [carerKey]: prev[carerKey] + 1,
      updatedAt: Date.now(),
    }
  }, [])

  const feed = useCallback(() => {
    let result = { message: '', gainedXp: 0 }
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
          fullness: Math.min(100, base.fullness + 28),
          happiness: Math.min(100, base.happiness + 4),
          cleanliness: Math.max(0, base.cleanliness - 3),
        },
        8,
      )
    })
    return result
  }, [award, setCat])

  const groom = useCallback(() => {
    let result = { message: '', gainedXp: 0 }
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
          cleanliness: Math.min(100, base.cleanliness + 34),
          happiness: Math.min(100, base.happiness + 5),
          energy: Math.max(0, base.energy - 3),
        },
        8,
      )
    })
    return result
  }, [award, setCat])

  const pet = useCallback(() => {
    let result = { message: '', gainedXp: 0 }
    setCat((prev) => {
      const now = Date.now()
      const base = applyDecay(prev, now)
      if (now - base.lastPettedAt < 4000) {
        return { ...base, happiness: Math.min(100, base.happiness + 1) }
      }
      result = { message: `${base.name} purrs`, gainedXp: 3 }
      return award(
        {
          ...base,
          happiness: Math.min(100, base.happiness + 7),
          lastPettedAt: now,
        },
        3,
      )
    })
    return result
  }, [award, setCat])

  const toggleSleep = useCallback(() => {
    let result = { message: '', gainedXp: 0 }
    setCat((prev) => {
      const base = applyDecay(prev, Date.now())
      const sleeping = !base.sleeping
      result = {
        message: sleeping ? `${base.name} curled up for a nap` : `${base.name} woke up`,
        gainedXp: 0,
      }
      return { ...base, sleeping, updatedAt: Date.now() }
    })
    return result
  }, [setCat])

  const finishPlay = useCallback(
    (score: number) => {
      let result = { message: '', gainedXp: 0 }
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
            happiness: Math.min(100, base.happiness + Math.min(32, 8 + score * 1.6)),
            energy: Math.max(0, base.energy - 12),
            fullness: Math.max(0, base.fullness - 6),
            cleanliness: Math.max(0, base.cleanliness - 4),
            bestScore: Math.max(base.bestScore, score),
            sleeping: false,
          },
          xp,
        )
      })
      return result
    },
    [award, setCat],
  )

  const setCarer = useCallback(
    (carer: 'you' | 'partner') => {
      setCat((prev) => ({ ...prev, activeCarer: carer }))
    },
    [setCat],
  )

  const rename = useCallback(
    (name: string) => {
      const trimmed = name.trim().slice(0, 18)
      if (!trimmed) return
      setCat((prev) => ({ ...prev, name: trimmed }))
    },
    [setCat],
  )

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
