import { useCallback, useMemo } from 'react'
import { createId, todayKey, useStored } from './useStored'
import type { Carer, PoopLog } from '../types'

const STORAGE_KEY = 'cuddles-club-poop-logs'

export interface WeekBar {
  key: string
  label: string
  count: number
  isToday: boolean
  isFuture: boolean
}

function entriesForOwner(entries: PoopLog[], owner: Carer): PoopLog[] {
  return entries.filter((entry) => entry.owner === owner)
}

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const

function calendarWeekDayKeys(): string[] {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const daysFromMonday = (today.getDay() + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - daysFromMonday)

  const keys: string[] = []
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    keys.push(todayKey(date))
  }
  return keys
}

function countByDay(entries: PoopLog[], owner: Carer): Map<string, number> {
  const map = new Map<string, number>()
  for (const entry of entriesForOwner(entries, owner)) {
    const key = todayKey(new Date(entry.createdAt))
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return map
}

function longestStreak(entries: PoopLog[], owner: Carer): number {
  const days = [...new Set(entriesForOwner(entries, owner).map((e) => todayKey(new Date(e.createdAt))))].sort()
  if (days.length === 0) return 0

  let best = 1
  let run = 1

  for (let index = 1; index < days.length; index += 1) {
    const prev = new Date(`${days[index - 1]}T12:00:00`)
    const curr = new Date(`${days[index]}T12:00:00`)
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000)
    if (diffDays === 1) {
      run += 1
      best = Math.max(best, run)
    } else {
      run = 1
    }
  }

  return best
}

function currentStreak(entries: PoopLog[], owner: Carer): number {
  const days = new Set(entriesForOwner(entries, owner).map((e) => todayKey(new Date(e.createdAt))))
  if (days.size === 0) return 0

  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)
  if (!days.has(todayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  while (days.has(todayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function lastPoopAt(entries: PoopLog[], owner: Carer): number | null {
  const owned = entriesForOwner(entries, owner)
  if (owned.length === 0) return null
  return Math.max(...owned.map((entry) => entry.createdAt))
}

function daysSince(timestamp: number | null): number | null {
  if (!timestamp) return null
  const then = new Date(timestamp)
  then.setHours(12, 0, 0, 0)
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  return Math.round((now.getTime() - then.getTime()) / 86_400_000)
}

function lastPoopLabel(days: number | null): string {
  if (days === null) return 'Not yet'
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function gutSummary(days: number | null, streak: number): { title: string; body: string } {
  if (days === null) {
    return { title: 'Ready when you are', body: 'Log your first poop to start tracking.' }
  }
  if (days === 0) {
    return { title: 'Excellent gut health', body: `You're on a ${streak} day streak.` }
  }
  if (days === 1) {
    return { title: 'Doing great so far', body: 'You last pooped yesterday.' }
  }
  if (days <= 3) {
    return { title: 'Pretty regular', body: `You last pooped ${days} days ago.` }
  }
  return { title: 'Check in today', body: `It's been ${days} days since your last log.` }
}

export function usePoopTracker() {
  const [entries, setEntries] = useStored<PoopLog[]>(STORAGE_KEY, [])

  const logPoop = useCallback((owner: Carer) => {
    const entry: PoopLog = {
      id: createId(),
      owner,
      createdAt: Date.now(),
    }
    setEntries((current) => [entry, ...current])
    return entry
  }, [setEntries])

  const removeLog = useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id))
  }, [setEntries])

  const statsFor = useCallback(
    (owner: Carer) => {
      const counts = countByDay(entries, owner)
      const todayKeyStr = todayKey()
      const weekKeys = calendarWeekDayKeys()
      const week: WeekBar[] = weekKeys.map((key, index) => ({
        key,
        label: WEEKDAY_LABELS[index],
        count: counts.get(key) ?? 0,
        isToday: key === todayKeyStr,
        isFuture: key > todayKeyStr,
      }))
      const maxWeek = Math.max(1, ...week.map((bar) => bar.count))
      const lastAt = lastPoopAt(entries, owner)
      const since = daysSince(lastAt)

      return {
        week,
        maxWeek,
        weekTotal: week.reduce((sum, bar) => sum + bar.count, 0),
        total: entriesForOwner(entries, owner).length,
        todayCount: counts.get(todayKey()) ?? 0,
        longestStreak: longestStreak(entries, owner),
        currentStreak: currentStreak(entries, owner),
        lastPoopLabel: lastPoopLabel(since),
        daysSinceLast: since,
        gut: gutSummary(since, currentStreak(entries, owner)),
        recent: entriesForOwner(entries, owner)
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 12),
      }
    },
    [entries],
  )

  const coupleTotals = useMemo(() => {
    const you = entriesForOwner(entries, 'you').length
    const partner = entriesForOwner(entries, 'partner').length
    return { you, partner, all: entries.length }
  }, [entries])

  return {
    entries,
    ready: true,
    logPoop,
    removeLog,
    statsFor,
    coupleTotals,
  }
}

export type UsePoopTrackerReturn = ReturnType<typeof usePoopTracker>
