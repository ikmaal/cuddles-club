import { useCallback, useEffect, useRef, useState } from 'react'
import { useCouple } from '../context/CoupleContext'
import { createId } from './useStored'
import { readImageFileAsDataUrl } from '../lib/polaroidSceneryImages'
import { fetchPolaroidScenery, savePolaroidScenery } from '../lib/supabaseData'
import type { PolaroidSceneryItem } from '../types'

const LOCAL_KEY = 'cuddles-club-polaroid-scenery-v1'
const MAX_ITEMS = 16

function loadLocal(): PolaroidSceneryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PolaroidSceneryItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocal(items: PolaroidSceneryItem[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items))
}

function defaultPlacement(index: number): Pick<PolaroidSceneryItem, 'x' | 'y' | 'rotation' | 'scale'> {
  const angle = index * 47
  return {
    x: 12 + ((index * 19) % 76),
    y: 10 + ((index * 23) % 72),
    rotation: -18 + (angle % 36),
    scale: 0.85 + (index % 3) * 0.08,
  }
}

export function usePolaroidScenery() {
  const { isCloud, coupleId } = useCouple()
  const [items, setItems] = useState<PolaroidSceneryItem[]>(() => (isCloud ? [] : loadLocal()))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const writeGen = useRef(0)
  const itemsRef = useRef(items)
  itemsRef.current = items

  const persist = useCallback(
    async (next: PolaroidSceneryItem[]) => {
      const gen = ++writeGen.current
      setBusy(true)
      setError('')
      try {
        if (isCloud && coupleId) {
          const saved = await savePolaroidScenery(coupleId, next)
          if (gen !== writeGen.current) return saved
          setItems(saved)
          return saved
        }
        saveLocal(next)
        if (gen !== writeGen.current) return next
        setItems(next)
        return next
      } catch (err) {
        if (gen === writeGen.current) {
          setError(err instanceof Error ? err.message : 'Could not save scenery')
        }
        throw err
      } finally {
        if (gen === writeGen.current) setBusy(false)
      }
    },
    [coupleId, isCloud],
  )

  useEffect(() => {
    if (!isCloud || !coupleId) {
      setItems(loadLocal())
      return
    }

    let cancelled = false
    void fetchPolaroidScenery(coupleId)
      .then((cloudItems) => {
        if (!cancelled) {
          setItems(cloudItems)
          setError('')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load scenery')
        }
      })

    return () => {
      cancelled = true
    }
  }, [coupleId, isCloud])

  const addFromDataUrl = useCallback(
    async (dataUrl: string) => {
      const current = itemsRef.current
      if (current.length >= MAX_ITEMS) {
        setError(`You can add up to ${MAX_ITEMS} stickers.`)
        return null
      }
      const placement = defaultPlacement(current.length)
      const item: PolaroidSceneryItem = {
        id: createId(),
        src: dataUrl,
        ...placement,
      }
      const next = [...current, item]
      await persist(next)
      return item
    },
    [persist],
  )

  const addFromFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Choose an image file.')
        return null
      }
      const dataUrl = await readImageFileAsDataUrl(file)
      return addFromDataUrl(dataUrl)
    },
    [addFromDataUrl],
  )

  const updateItem = useCallback(
    (id: string, patch: Partial<Pick<PolaroidSceneryItem, 'x' | 'y' | 'rotation' | 'scale'>>) => {
      setItems((prev) => {
        const next = prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
        itemsRef.current = next
        if (!isCloud || !coupleId) saveLocal(next)
        return next
      })
    },
    [coupleId, isCloud],
  )

  const commitItems = useCallback(async () => {
    await persist(itemsRef.current)
  }, [persist])

  const removeItem = useCallback(
    async (id: string) => {
      const next = items.filter((item) => item.id !== id)
      await persist(next)
    },
    [items, persist],
  )

  return {
    items,
    busy,
    error,
    addFromFile,
    addFromDataUrl,
    updateItem,
    commitItems,
    removeItem,
    setError,
  }
}
