import { createId } from './hooks/useStored'
import type { Moment } from './types'

const DB_NAME = 'cuddles-club-moments'
const STORE = 'moments'
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
    request.onerror = () => reject(request.error ?? new Error('Failed to open moments database'))
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
        request.onerror = () => reject(request.error ?? new Error('Moments storage failed'))
        tx.oncomplete = () => db.close()
      }),
  )
}

export async function listMoments(): Promise<Moment[]> {
  const rows = await run('readonly', (store) => store.getAll())
  return (rows as Moment[]).sort((a, b) => b.createdAt - a.createdAt)
}

export async function putMoment(moment: Moment): Promise<void> {
  await run('readwrite', (store) => store.put(moment))
}

export async function deleteMoment(id: string): Promise<void> {
  await run('readwrite', (store) => store.delete(id))
}

export function createMoment(image: string, caption: string): Moment {
  return {
    id: createId(),
    caption: caption.trim().slice(0, 48),
    image,
    createdAt: Date.now(),
  }
}
