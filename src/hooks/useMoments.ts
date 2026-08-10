import { useCallback, useEffect, useState } from 'react'
import {
  createMoment,
  deleteMoment,
  listMoments,
  putMoment,
} from '../momentsDb'
import type { Moment } from '../types'

export function useMoments() {
  const [moments, setMoments] = useState<Moment[]>([])
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const rows = await listMoments()
    setMoments(rows)
  }, [])

  useEffect(() => {
    let alive = true
    void listMoments()
      .then((rows) => {
        if (!alive) return
        setMoments(rows)
        setReady(true)
      })
      .catch(() => {
        if (!alive) return
        setError('Could not load moments')
        setReady(true)
      })
    return () => {
      alive = false
    }
  }, [])

  const addPolaroid = useCallback(
    async (image: string, caption: string) => {
      setBusy(true)
      setError('')
      try {
        const moment = createMoment(image, caption)
        await putMoment(moment)
        await refresh()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save that moment')
        return false
      } finally {
        setBusy(false)
      }
    },
    [refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      setBusy(true)
      setError('')
      try {
        await deleteMoment(id)
        await refresh()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not delete that moment')
        return false
      } finally {
        setBusy(false)
      }
    },
    [refresh],
  )

  return {
    moments,
    ready,
    busy,
    error,
    setError,
    addPolaroid,
    remove,
  }
}
