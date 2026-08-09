import { createId } from './hooks/useStored'
import type { CustomStripFrame } from './types'

const DB_NAME = 'cuddles-club-strip-frames'
const STORE = 'frames'
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
    request.onerror = () => reject(request.error ?? new Error('Failed to open strip frames database'))
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
        request.onerror = () => reject(request.error ?? new Error('Strip frame storage failed'))
        tx.oncomplete = () => db.close()
      }),
  )
}

export async function listCustomStripFrames(): Promise<CustomStripFrame[]> {
  const rows = await run('readonly', (store) => store.getAll())
  return (rows as CustomStripFrame[]).sort((a, b) => b.createdAt - a.createdAt)
}

export async function putCustomStripFrame(frame: CustomStripFrame): Promise<void> {
  await run('readwrite', (store) => store.put(frame))
}

export async function deleteCustomStripFrame(id: string): Promise<void> {
  await run('readwrite', (store) => store.delete(id))
}

export async function createCustomStripFrameFromFile(file: File): Promise<CustomStripFrame> {
  const { compressImage } = await import('./stripsDb')
  // Keep enough resolution for the tall strip canvas (420×1260).
  const image = await compressImage(file, 1600, 0.88)
  const label = file.name.replace(/\.[^.]+$/, '').trim().slice(0, 28) || 'My frame'
  return {
    id: createId(),
    label,
    image,
    createdAt: Date.now(),
  }
}
