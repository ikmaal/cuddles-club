import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createMaterial,
  createModule,
  deleteLocalMaterial,
  deleteLocalModule,
  getLocalFile,
  listLocalMaterials,
  listLocalModules,
  putLocalFile,
  putLocalMaterial,
  putLocalModule,
} from '../academicsDb'
import { useCouple } from '../context/CoupleContext'
import {
  deleteAcademicMaterialCloud,
  deleteAcademicModuleCloud,
  loadAcademics,
  removeAcademicStorage,
  uploadAcademicFile,
  upsertAcademicMaterial,
  upsertAcademicModule,
} from '../lib/academicsData'
import type {
  AcademicMaterial,
  AcademicMaterialKind,
  AcademicModule,
  Carer,
} from '../types'

function asErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof DOMException && err.name === 'QuotaExceededError') {
    return 'This file is too large to save on this device.'
  }
  if (err instanceof Error && err.message.trim()) return err.message
  if (typeof err === 'object' && err && 'message' in err) {
    const message = (err as { message: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
}

const objectUrls = new Map<string, string>()

function revokeUrl(id: string) {
  const url = objectUrls.get(id)
  if (url) {
    URL.revokeObjectURL(url)
    objectUrls.delete(id)
  }
}

async function hydrateLocalMaterials(rows: AcademicMaterial[]): Promise<AcademicMaterial[]> {
  return Promise.all(
    rows.map(async (row) => {
      revokeUrl(row.id)
      const blob = await getLocalFile(row.id)
      if (!blob) return { ...row, fileUrl: row.fileUrl || '' }
      const url = URL.createObjectURL(blob)
      objectUrls.set(row.id, url)
      return { ...row, fileUrl: url }
    }),
  )
}

export function useAcademics() {
  const { isCloud, coupleId, slot, profile } = useCouple()
  const [modules, setModules] = useState<AcademicModule[]>([])
  const [materials, setMaterials] = useState<AcademicMaterial[]>([])
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      if (isCloud && coupleId && slot) {
        const data = await loadAcademics(coupleId, slot)
        setModules(data.modules)
        setMaterials(data.materials)
      } else {
        const [localModules, localMaterials] = await Promise.all([
          listLocalModules(),
          listLocalMaterials(),
        ])
        setModules(localModules)
        setMaterials(await hydrateLocalMaterials(localMaterials))
      }
      setError('')
    } catch (err) {
      setError(asErrorMessage(err, 'Could not load Academics'))
    } finally {
      setReady(true)
    }
  }, [coupleId, isCloud, slot])

  useEffect(() => {
    setReady(false)
    void refresh()
    return () => {
      for (const id of objectUrls.keys()) revokeUrl(id)
    }
  }, [refresh])

  const names = useMemo(
    () => ({
      you: profile.nameYou.trim() || 'You',
      partner: profile.namePartner.trim() || 'Partner',
    }),
    [profile.namePartner, profile.nameYou],
  )

  const addModule = useCallback(
    async (owner: Carer, input: { code: string; title: string; term?: string }) => {
      if (!input.title.trim()) return null
      setBusy(true)
      setError('')
      try {
        const module = createModule(owner, input)
        if (isCloud && coupleId && slot) {
          await upsertAcademicModule(coupleId, module, slot)
        } else {
          await putLocalModule(module)
        }
        setModules((prev) => [...prev, module].sort((a, b) => a.title.localeCompare(b.title)))
        return module
      } catch (err) {
        setError(asErrorMessage(err, 'Could not add module'))
        return null
      } finally {
        setBusy(false)
      }
    },
    [coupleId, isCloud, slot],
  )

  const removeModule = useCallback(
    async (id: string) => {
      setBusy(true)
      setError('')
      try {
        if (isCloud && coupleId) {
          await deleteAcademicModuleCloud(coupleId, id)
        } else {
          await deleteLocalModule(id)
        }
        const related = materials.filter((item) => item.moduleId === id)
        for (const item of related) revokeUrl(item.id)
        setModules((prev) => prev.filter((item) => item.id !== id))
        setMaterials((prev) => prev.filter((item) => item.moduleId !== id))
        return true
      } catch (err) {
        setError(asErrorMessage(err, 'Could not delete module'))
        return false
      } finally {
        setBusy(false)
      }
    },
    [coupleId, isCloud, materials],
  )

  const addMaterial = useCallback(
    async (
      moduleId: string,
      input: {
        kind: AcademicMaterialKind
        title: string
        dueDate?: string
        notes?: string
        file?: File | null
      },
    ) => {
      if (!input.title.trim()) return null
      setBusy(true)
      setError('')
      try {
        let material = createMaterial(moduleId, input)

        if (input.file) {
          if (isCloud && coupleId) {
            const uploaded = await uploadAcademicFile(coupleId, material.id, input.file)
            material = {
              ...material,
              fileName: uploaded.fileName,
              fileUrl: uploaded.fileUrl,
              storagePath: uploaded.storagePath,
            }
            await upsertAcademicMaterial(coupleId, material)
          } else {
            await putLocalFile(material.id, input.file)
            const url = URL.createObjectURL(input.file)
            objectUrls.set(material.id, url)
            material = {
              ...material,
              fileName: input.file.name,
              fileUrl: url,
            }
            await putLocalMaterial(material)
          }
        } else if (isCloud && coupleId) {
          await upsertAcademicMaterial(coupleId, material)
        } else {
          await putLocalMaterial(material)
        }
        setMaterials((prev) => [material, ...prev])
        return material
      } catch (err) {
        setError(asErrorMessage(err, 'Could not add material'))
        return null
      } finally {
        setBusy(false)
      }
    },
    [coupleId, isCloud],
  )

  const toggleMaterialDone = useCallback(
    async (id: string) => {
      const current = materials.find((item) => item.id === id)
      if (!current) return false
      const next = { ...current, done: !current.done }
      setBusy(true)
      setError('')
      try {
        if (isCloud && coupleId) {
          await upsertAcademicMaterial(coupleId, next)
        } else {
          await putLocalMaterial(next)
        }
        setMaterials((prev) => prev.map((item) => (item.id === id ? next : item)))
        return true
      } catch (err) {
        setError(asErrorMessage(err, 'Could not update item'))
        return false
      } finally {
        setBusy(false)
      }
    },
    [coupleId, isCloud, materials],
  )

  const removeMaterial = useCallback(
    async (id: string) => {
      const current = materials.find((item) => item.id === id)
      if (!current) return false
      setBusy(true)
      setError('')
      try {
        if (isCloud && coupleId) {
          await deleteAcademicMaterialCloud(coupleId, current)
        } else {
          await deleteLocalMaterial(id)
        }
        revokeUrl(id)
        setMaterials((prev) => prev.filter((item) => item.id !== id))
        return true
      } catch (err) {
        setError(asErrorMessage(err, 'Could not delete item'))
        return false
      } finally {
        setBusy(false)
      }
    },
    [coupleId, isCloud, materials],
  )

  const updateMaterial = useCallback(
    async (
      id: string,
      input: {
        title?: string
        dueDate?: string
        notes?: string
        file?: File | null
      },
    ) => {
      const current = materials.find((item) => item.id === id)
      if (!current) return null
      setBusy(true)
      setError('')
      try {
        let next: AcademicMaterial = {
          ...current,
          title: input.title !== undefined ? input.title.trim() : current.title,
          dueDate: input.dueDate !== undefined ? input.dueDate.trim() : current.dueDate,
          notes: input.notes !== undefined ? input.notes.trim() : current.notes,
        }
        if (!next.title) {
          setError('Add a title first')
          return null
        }

        if (input.file) {
          if (isCloud && coupleId) {
            const previousPath = current.storagePath
            const uploaded = await uploadAcademicFile(coupleId, next.id, input.file)
            next = {
              ...next,
              fileName: uploaded.fileName,
              fileUrl: uploaded.fileUrl,
              storagePath: uploaded.storagePath,
            }
            await upsertAcademicMaterial(coupleId, next)
            if (previousPath && previousPath !== uploaded.storagePath) {
              await removeAcademicStorage(previousPath)
            }
          } else {
            revokeUrl(next.id)
            await putLocalFile(next.id, input.file)
            const url = URL.createObjectURL(input.file)
            objectUrls.set(next.id, url)
            next = {
              ...next,
              fileName: input.file.name,
              fileUrl: url,
            }
            await putLocalMaterial(next)
          }
        } else if (isCloud && coupleId) {
          await upsertAcademicMaterial(coupleId, next)
        } else {
          await putLocalMaterial(next)
        }

        setMaterials((prev) => prev.map((item) => (item.id === id ? next : item)))
        return next
      } catch (err) {
        setError(asErrorMessage(err, 'Could not update item'))
        return null
      } finally {
        setBusy(false)
      }
    },
    [coupleId, isCloud, materials],
  )

  return {
    modules,
    materials,
    ready,
    busy,
    error,
    names,
    isCloud,
    setError,
    refresh,
    addModule,
    removeModule,
    addMaterial,
    toggleMaterialDone,
    removeMaterial,
    updateMaterial,
  }
}
