import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createId,
  loadPlaces,
  loadProfile,
  savePlaces,
  saveProfile,
} from '../storage'
import type { CoupleProfile, Place } from '../types'

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>(() => loadPlaces())
  const [profile, setProfile] = useState<CoupleProfile>(() => loadProfile())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    savePlaces(places)
  }, [places, ready])

  useEffect(() => {
    if (!ready) return
    saveProfile(profile)
  }, [profile, ready])

  const addPlace = useCallback((input: Omit<Place, 'id' | 'createdAt'>) => {
    const place: Place = {
      ...input,
      id: createId(),
      createdAt: new Date().toISOString(),
    }
    setPlaces((prev) => [place, ...prev])
    return place
  }, [])

  const updatePlace = useCallback((id: string, patch: Partial<Place>) => {
    setPlaces((prev) =>
      prev.map((place) => (place.id === id ? { ...place, ...patch } : place)),
    )
  }, [])

  const deletePlace = useCallback((id: string) => {
    setPlaces((prev) => prev.filter((place) => place.id !== id))
  }, [])

  const updateProfile = useCallback((next: CoupleProfile) => {
    setProfile(next)
  }, [])

  const sorted = useMemo(
    () =>
      [...places].sort(
        (a, b) =>
          new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime(),
      ),
    [places],
  )

  return {
    places: sorted,
    profile,
    addPlace,
    updatePlace,
    deletePlace,
    updateProfile,
  }
}
