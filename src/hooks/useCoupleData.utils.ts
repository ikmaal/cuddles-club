import type { Countdown } from '../types'

export function daysUntil(event: Countdown): number | null {
  const target = new Date(`${event.date}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let next = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  if (event.repeatsYearly) {
    next = new Date(today.getFullYear(), target.getMonth(), target.getDate())
    if (next.getTime() < today.getTime()) {
      next = new Date(today.getFullYear() + 1, target.getMonth(), target.getDate())
    }
  }

  return Math.round((next.getTime() - today.getTime()) / 86_400_000)
}
