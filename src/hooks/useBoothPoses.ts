import { useCallback, useEffect, useRef, useState } from 'react'
import { useCouple } from '../context/CoupleContext'
import {
  deleteBoothPose,
  listBoothPoses,
  uploadBoothPoseFile,
} from '../lib/supabaseData'
import type { BoothPosePhoto } from '../types'

export function useBoothPoses() {
  const { isCloud, coupleId } = useCouple()
  const [poses, setPoses] = useState<BoothPosePhoto[]>([])
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const posesRef = useRef(poses)
  posesRef.current = poses

  const load = useCallback(async () => {
    try {
      if (isCloud && coupleId) {
        setPoses(await listBoothPoses(coupleId))
      } else {
        const { listPosePhotos } = await import('../posesDb')
        setPoses(await listPosePhotos())
      }
      setError('')
    } catch {
      setError('Could not load pose photos.')
    } finally {
      setReady(true)
    }
  }, [coupleId, isCloud])

  useEffect(() => {
    setReady(false)
    void load()
  }, [load])

  const addFromFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return null
      setBusy(true)
      setError('')
      try {
        if (isCloud && coupleId) {
          const pose = await uploadBoothPoseFile(coupleId, file)
          setPoses((prev) => [pose, ...prev])
          return pose
        }
        const { createPoseFromFile, putPosePhoto } = await import('../posesDb')
        const pose = await createPoseFromFile(file)
        await putPosePhoto(pose)
        setPoses((prev) => [pose, ...prev])
        return pose
      } catch {
        setError('Could not save that pose photo.')
        return null
      } finally {
        setBusy(false)
      }
    },
    [coupleId, isCloud],
  )

  const remove = useCallback(
    async (id: string) => {
      const match = posesRef.current.find((pose) => pose.id === id)
      setPoses((prev) => prev.filter((pose) => pose.id !== id))
      try {
        if (isCloud && coupleId && match) {
          await deleteBoothPose(match, coupleId)
          return
        }
        const { deletePosePhoto } = await import('../posesDb')
        await deletePosePhoto(id)
      } catch {
        setError('Could not delete that pose photo.')
        void load()
      }
    },
    [coupleId, isCloud, load],
  )

  return {
    poses,
    ready,
    busy,
    error,
    isCloud,
    addFromFile,
    remove,
    clearError: () => setError(''),
  }
}
