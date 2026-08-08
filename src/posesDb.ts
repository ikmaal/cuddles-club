import { createId } from './hooks/useStored'
import type { BoothPosePhoto } from './types'

const DB_NAME = 'cuddles-club-poses'
const STORE = 'poses'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open poses database'))
  })
}

function run<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const request = work(tx.objectStore(STORE))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('Pose storage failed'))
        tx.oncomplete = () => db.close()
      }),
  )
}

export async function listPosePhotos(): Promise<BoothPosePhoto[]> {
  const rows = await run('readonly', (store) => store.getAll())
  return (rows as BoothPosePhoto[]).sort((a, b) => b.createdAt - a.createdAt)
}

export async function putPosePhoto(pose: BoothPosePhoto): Promise<void> {
  await run('readwrite', (store) => store.put(pose))
}

export async function deletePosePhoto(id: string): Promise<void> {
  await run('readwrite', (store) => store.delete(id))
}

export async function createPoseFromFile(file: File): Promise<BoothPosePhoto> {
  const { compressImage } = await import('./stripsDb')
  const image = await compressImage(file, 1200, 0.84)
  return {
    id: createId(),
    image,
    createdAt: Date.now(),
  }
}
