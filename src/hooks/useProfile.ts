import { useCallback, useEffect, useState } from 'react'
import { loadProfile, saveProfile } from '../storage'
import type { CoupleProfile } from '../types'

export function useProfile() {
  const [profile, setProfile] = useState<CoupleProfile>(() => loadProfile())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    saveProfile(profile)
  }, [profile, ready])

  const updateProfile = useCallback((next: CoupleProfile) => {
    setProfile({
      nameYou: next.nameYou.trim().slice(0, 18) || 'You',
      namePartner: next.namePartner.trim().slice(0, 18) || 'Partner',
      since: next.since,
    })
  }, [])

  return { profile, updateProfile }
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
