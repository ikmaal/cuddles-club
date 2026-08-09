import { useCallback, useEffect, useRef, useState } from 'react'
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
  const [photoKey, setPhotoKey] = useState(0)
  const writeGen = useRef(0)
  const photoRef = useRef(photo)

  const showPhoto = useCallback((next: string) => {
    if (photoRef.current === next) return
    photoRef.current = next
    setPhoto(next)
    setPhotoKey((value) => value + 1)
  }, [])

  const refreshFromCloud = useCallback(async () => {
    if (!isCloud || !coupleId) return
    const gen = writeGen.current
    try {
      const url = await fetchHomePhotoUrl(coupleId)
      if (gen !== writeGen.current) return
      showPhoto(url)
      setError('')
    } catch (err) {
      if (gen !== writeGen.current) return
      setError(err instanceof Error ? err.message : 'Could not load home photo')
    }
  }, [coupleId, isCloud, showPhoto])

  useEffect(() => {
    if (!isCloud || !coupleId) {
      showPhoto(loadLocalHomePhoto())
      return
    }

    let cancelled = false

    const sync = async () => {
      const gen = writeGen.current
      try {
        const cloudUrl = await fetchHomePhotoUrl(coupleId)
        if (cancelled || gen !== writeGen.current) return

        if (!cloudUrl) {
          const local = loadLocalHomePhoto()
          if (local) {
            writeGen.current += 1
            const uploadGen = writeGen.current
            showPhoto(local)
            const uploaded = await uploadHomePhoto(coupleId, local)
            if (cancelled || uploadGen !== writeGen.current) return
            showPhoto(uploaded)
            removeLocalHomePhoto()
            return
          }
        }

        showPhoto(cloudUrl)
        setError('')
      } catch (err) {
        if (!cancelled && gen === writeGen.current) {
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
  }, [coupleId, isCloud, refreshFromCloud, showPhoto])

  const saveDataUrl = useCallback(
    async (dataUrl: string) => {
      const gen = ++writeGen.current
      setBusy(true)
      setError('')
      // Show the cropped photo immediately so replaces never look stuck on the old image.
      showPhoto(dataUrl)
      try {
        if (isCloud && coupleId) {
          const url = await uploadHomePhoto(coupleId, dataUrl)
          if (gen !== writeGen.current) return
          showPhoto(url)
        } else {
          saveLocalHomePhoto(dataUrl)
        }
      } catch (err) {
        if (gen === writeGen.current) {
          setError(err instanceof Error ? err.message : 'Could not save home photo')
        }
        throw err
      } finally {
        if (gen === writeGen.current) setBusy(false)
      }
    },
    [coupleId, isCloud, showPhoto],
  )

  const clear = useCallback(async () => {
    const gen = ++writeGen.current
    setBusy(true)
    setError('')
    try {
      if (isCloud && coupleId) {
        await clearHomePhoto(coupleId)
      }
      if (gen !== writeGen.current) return
      removeLocalHomePhoto()
      showPhoto('')
    } catch (err) {
      if (gen === writeGen.current) {
        setError(err instanceof Error ? err.message : 'Could not remove home photo')
      }
      throw err
    } finally {
      if (gen === writeGen.current) setBusy(false)
    }
  }, [coupleId, isCloud, showPhoto])

  return { photo, photoKey, busy, error, saveDataUrl, clear, isCloud }
}
