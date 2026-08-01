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
    })
  }, [])

  return { profile, updateProfile }
}
