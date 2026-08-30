import { useCallback, useEffect, useState } from 'react'
import { useCouple } from '../context/CoupleContext'
import { withMyPlaceRating } from '../lib/placeRatings'
import {
  deleteFoodPlaceCloud,
  loadPlaces,
  uploadPlacePhoto,
  upsertFoodPlace,
} from '../lib/placesData'
import { createPlace, deleteLocalPlace, listLocalPlaces, putLocalPlace } from '../placesDb'
import type { FoodPlace, FoodPlaceStatus } from '../types'

export interface PlaceDraft {
  name: string
  status: FoodPlaceStatus
  area: string
  cuisine: string
  address: string
  notes: string
  myRating: number
  lat: number | null
  lng: number | null
  visitedAt: string
  photoFile?: File | null
}

async function fileToJpegBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const max = 1280
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not prepare photo')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((next) => resolve(next), 'image/jpeg', 0.86)
  })
  if (!blob) throw new Error('Could not save photo')
  return blob
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read photo'))
    reader.readAsDataURL(blob)
  })
}

export function usePlaces() {
  const { isCloud, coupleId, slot } = useCouple()
  const mySlot = slot ?? 'a'
  const [places, setPlaces] = useState<FoodPlace[]>([])
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      if (isCloud && coupleId) {
        setPlaces(await loadPlaces(coupleId))
      } else {
        setPlaces(await listLocalPlaces())
      }
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load places')
    } finally {
      setReady(true)
    }
  }, [coupleId, isCloud])

  useEffect(() => {
    setReady(false)
    void refresh()
  }, [refresh])

  const savePlace = useCallback(
    async (draft: PlaceDraft, existing?: FoodPlace | null) => {
      if (!draft.name.trim()) return null
      setBusy(true)
      setError('')
      try {
        let place: FoodPlace = existing
          ? {
              ...existing,
              name: draft.name.trim(),
              status: draft.status,
              area: draft.area.trim(),
              cuisine: draft.cuisine.trim(),
              address: draft.address.trim(),
              notes: draft.notes.trim(),
              lat: draft.lat,
              lng: draft.lng,
              visitedAt: draft.status === 'been' ? draft.visitedAt.trim() : '',
            }
          : createPlace(draft, mySlot)

        if (draft.status === 'been') {
          place = withMyPlaceRating(place, draft.myRating, mySlot)
        }

        if (draft.photoFile) {
          const blob = await fileToJpegBlob(draft.photoFile)
          if (isCloud && coupleId) {
            const uploaded = await uploadPlacePhoto(coupleId, place.id, blob)
            place = { ...place, photoUrl: uploaded.photoUrl, storagePath: uploaded.storagePath }
          } else {
            place = { ...place, photoUrl: await blobToDataUrl(blob), storagePath: '' }
          }
        }

        if (isCloud && coupleId) {
          await upsertFoodPlace(coupleId, place)
        } else {
          await putLocalPlace(place)
        }

        setPlaces((prev) => {
          const without = prev.filter((item) => item.id !== place.id)
          return [place, ...without]
        })
        return place
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save place')
        return null
      } finally {
        setBusy(false)
      }
    },
    [coupleId, isCloud, mySlot],
  )

  const markBeen = useCallback(
    async (id: string) => {
      const current = places.find((item) => item.id === id)
      if (!current) return false
      const next: FoodPlace = {
        ...current,
        status: 'been',
        visitedAt: current.visitedAt || new Date().toISOString().slice(0, 10),
      }
      setBusy(true)
      setError('')
      try {
        if (isCloud && coupleId) await upsertFoodPlace(coupleId, next)
        else await putLocalPlace(next)
        setPlaces((prev) => prev.map((item) => (item.id === id ? next : item)))
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not update place')
        return false
      } finally {
        setBusy(false)
      }
    },
    [coupleId, isCloud, places],
  )

  const removePlace = useCallback(
    async (id: string) => {
      const current = places.find((item) => item.id === id)
      if (!current) return false
      setBusy(true)
      setError('')
      try {
        if (isCloud && coupleId) await deleteFoodPlaceCloud(coupleId, current)
        else await deleteLocalPlace(id)
        setPlaces((prev) => prev.filter((item) => item.id !== id))
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not delete place')
        return false
      } finally {
        setBusy(false)
      }
    },
    [coupleId, isCloud, places],
  )

  return {
    places,
    ready,
    busy,
    error,
    isCloud,
    setError,
    savePlace,
    markBeen,
    removePlace,
  }
}
