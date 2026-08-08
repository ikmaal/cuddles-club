import { useCallback, useState } from 'react'

const HOME_PHOTO_KEY = 'cuddles-club-home-photo-v1'

function loadHomePhoto(): string {
  try {
    return localStorage.getItem(HOME_PHOTO_KEY) ?? ''
  } catch {
    return ''
  }
}

function compressHomePhoto(file: File, maxEdge = 900, quality = 0.84): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not prepare the image'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image'))
    }
    img.src = url
  })
}

export function useHomePhoto() {
  const [photo, setPhoto] = useState(loadHomePhoto)
  const [busy, setBusy] = useState(false)

  const setFromFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setBusy(true)
    try {
      const dataUrl = await compressHomePhoto(file)
      localStorage.setItem(HOME_PHOTO_KEY, dataUrl)
      setPhoto(dataUrl)
    } finally {
      setBusy(false)
    }
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem(HOME_PHOTO_KEY)
    setPhoto('')
  }, [])

  return { photo, busy, setFromFile, clear }
}
