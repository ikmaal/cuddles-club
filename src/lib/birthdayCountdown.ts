/** Girlfriend's birthday — 16 November 2026, local midnight. */
export const BIRTHDAY_EVENT_ISO = '2026-11-16'

export function birthdayTargetDate(): Date {
  return new Date(`${BIRTHDAY_EVENT_ISO}T00:00:00`)
}

export type BirthdayCountdownParts = {
  reached: boolean
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
}

export function getBirthdayCountdown(now = new Date()): BirthdayCountdownParts {
  const target = birthdayTargetDate()
  const totalMs = target.getTime() - now.getTime()
  if (totalMs <= 0) {
    return { reached: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 }
  }
  const totalSeconds = Math.floor(totalMs / 1000)
  return {
    reached: false,
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs,
  }
}

export function formatBirthdayEventDate(): string {
  const date = birthdayTargetDate()
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Short label for the countdown card (e.g. "Countdown to 16 Nov ♡"). */
export function formatBirthdayCountdownTitle(): string {
  const date = birthdayTargetDate()
  const day = date.getDate()
  const month = date.toLocaleDateString('en-GB', { month: 'short' })
  return `Countdown to ${day} ${month} ♡`
}
