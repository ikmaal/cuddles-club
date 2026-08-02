import { useCallback, useEffect, useState } from 'react'
import {
  createStripFromFile,
  deleteStrip,
  ensureSampleStrip,
  putStrip,
} from '../stripsDb'
import type { Photostrip } from '../types'

export function usePhotostrips() {
  const [strips, setStrips] = useState<Photostrip[]>([])
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ensureSampleStrip()
      .then((rows) => {
        if (alive) setStrips(rows)
      })
      .catch(() => {
        if (alive) setError('Could not load your photo strips')
      })
      .finally(() => {
        if (alive) setReady(true)
      })
    return () => {
      alive = false
    }
  }, [])

  const addFromFile = useCallback(async (file: File, title: string) => {
    setBusy(true)
    setError('')
    try {
      const strip = await createStripFromFile(file, title)
      await putStrip(strip)
      setStrips((prev) => [strip, ...prev])
      return strip
    } catch {
      setError('Could not save that strip. Try a smaller photo.')
      return null
    } finally {
      setBusy(false)
    }
  }, [])

  const rename = useCallback(async (id: string, title: string) => {
    const next = title.trim().slice(0, 40)
    if (!next) return
    setStrips((prev) => {
      const match = prev.find((strip) => strip.id === id)
      if (!match) return prev
      const updated = { ...match, title: next }
      void putStrip(updated)
      return prev.map((strip) => (strip.id === id ? updated : strip))
    })
  }, [])

  const remove = useCallback(async (id: string) => {
    await deleteStrip(id)
    setStrips((prev) => prev.filter((strip) => strip.id !== id))
  }, [])

  return { strips, ready, busy, error, addFromFile, rename, remove, setError }
}
