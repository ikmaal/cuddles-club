import { useCouple } from '../context/CoupleContext'

export function useProfile() {
  const { profile, updateProfile, ready } = useCouple()
  return { profile, updateProfile, ready }
}

export function daysTogether(since: string): number | null {
  if (!since) return null
  const start = new Date(`${since}T00:00:00`)
  if (Number.isNaN(start.getTime())) return null

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.floor((today.getTime() - start.getTime()) / 86_400_000)
  return days >= 0 ? days : null
}
