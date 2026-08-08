import { useCallback, useEffect, useState } from 'react'
import { useCouple } from '../context/CoupleContext'
import {
  clearHomePhoto,
  fetchHomePhotoUrl,
  uploadHomePhoto,
} from '../lib/supabaseData'

const HOME_PHOTO_KEY = 'cuddles-club-home-photo-v1'
const POLL_MS = 30_000

function loadLocalHomePhoto(): string {
  try {
    return localStorage.getItem(HOME_PHOTO_KEY) ?? ''
  } catch {
    return ''
  }
}

function saveLocalHomePhoto(dataUrl: string) {
  localStorage.setItem(HOME_PHOTO_KEY, dataUrl)
}

function removeLocalHomePhoto() {
  localStorage.removeItem(HOME_PHOTO_KEY)
}

export function useHomePhoto() {
  const { isCloud, coupleId } = useCouple()
  const [photo, setPhoto] = useState(() => (isCloud ? '' : loadLocalHomePhoto()))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refreshFromCloud = useCallback(async () => {
    if (!isCloud || !coupleId) return
    try {
      const url = await fetchHomePhotoUrl(coupleId)
      setPhoto(url)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load home photo')
    }
  }, [coupleId, isCloud])

  useEffect(() => {
    if (!isCloud || !coupleId) {
      setPhoto(loadLocalHomePhoto())
      return
    }

    let cancelled = false

    const sync = async () => {
      try {
        const cloudUrl = await fetchHomePhotoUrl(coupleId)
        if (cancelled) return

        if (!cloudUrl) {
          const local = loadLocalHomePhoto()
          if (local) {
            const uploaded = await uploadHomePhoto(coupleId, local)
            if (cancelled) return
            setPhoto(uploaded)
            removeLocalHomePhoto()
            return
          }
        }

        setPhoto(cloudUrl)
        setError('')
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load home photo')
        }
      }
    }

    void sync()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshFromCloud()
    }, POLL_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshFromCloud()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [coupleId, isCloud, refreshFromCloud])

  const saveDataUrl = useCallback(
    async (dataUrl: string) => {
      setBusy(true)
      setError('')
      try {
        if (isCloud && coupleId) {
          const url = await uploadHomePhoto(coupleId, dataUrl)
          setPhoto(url)
        } else {
          saveLocalHomePhoto(dataUrl)
          setPhoto(dataUrl)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save home photo')
        throw err
      } finally {
        setBusy(false)
      }
    },
    [coupleId, isCloud],
  )

  const clear = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      if (isCloud && coupleId) {
        await clearHomePhoto(coupleId)
      }
      removeLocalHomePhoto()
      setPhoto('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove home photo')
      throw err
    } finally {
      setBusy(false)
    }
  }, [coupleId, isCloud])

  return { photo, busy, error, saveDataUrl, clear, isCloud }
}
