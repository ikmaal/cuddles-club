import { createId } from './hooks/useStored'
import type { MemberSlot } from './lib/coupleSlot'
import { clampPlaceRating } from './lib/placeRating'
import { normalizePlaceRatings } from './lib/placeRatings'
import type { FoodPlace, FoodPlaceStatus } from './types'

const DB_NAME = 'cuddles-club-places'
const DB_VERSION = 1
const STORE = 'places'

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
    request.onerror = () => reject(request.error ?? new Error('Failed to open places database'))
  })
}

function req<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Places storage failed'))
  })
}

function normalize(row: FoodPlace & { rating?: number }): FoodPlace {
  const { ratingA, ratingB } = normalizePlaceRatings(row)
  return {
    id: row.id,
    name: row.name ?? '',
    status: row.status === 'want' ? 'want' : 'been',
    area: row.area ?? '',
    cuisine: row.cuisine ?? '',
    address: row.address ?? '',
    notes: row.notes ?? '',
    ratingA,
    ratingB,
    lat: typeof row.lat === 'number' ? row.lat : null,
    lng: typeof row.lng === 'number' ? row.lng : null,
    photoUrl: row.photoUrl ?? '',
    storagePath: row.storagePath ?? '',
    visitedAt: row.visitedAt ?? '',
    createdAt: Number(row.createdAt) || Date.now(),
  }
}

export async function listLocalPlaces(): Promise<FoodPlace[]> {
  const db = await openDb()
  const rows = await req(db.transaction(STORE, 'readonly').objectStore(STORE).getAll())
  return (rows as FoodPlace[])
    .map(normalize)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export async function putLocalPlace(place: FoodPlace): Promise<void> {
  const db = await openDb()
  await req(db.transaction(STORE, 'readwrite').objectStore(STORE).put(normalize(place)))
}

export async function deleteLocalPlace(id: string): Promise<void> {
  const db = await openDb()
  await req(db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id))
}

export function createPlace(
  input: {
  name: string
  status: FoodPlaceStatus
  area?: string
  cuisine?: string
  address?: string
  notes?: string
  myRating?: number
  lat?: number | null
  lng?: number | null
  visitedAt?: string
},
  slot: MemberSlot,
): FoodPlace {
  const myRating = input.status === 'been' ? clampPlaceRating(input.myRating ?? 0) : 0
  return {
    id: createId(),
    name: input.name.trim(),
    status: input.status,
    area: input.area?.trim() ?? '',
    cuisine: input.cuisine?.trim() ?? '',
    address: input.address?.trim() ?? '',
    notes: input.notes?.trim() ?? '',
    ratingA: slot === 'a' ? myRating : 0,
    ratingB: slot === 'b' ? myRating : 0,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    photoUrl: '',
    storagePath: '',
    visitedAt: input.visitedAt?.trim() ?? '',
    createdAt: Date.now(),
  }
}
