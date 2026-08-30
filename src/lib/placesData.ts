import { normalizePlaceRatings } from './placeRatings'
import { PHOTOSTRIP_BUCKET, supabase } from './supabase'
import type { FoodPlace } from '../types'

function client() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

function publicFileUrl(storagePath: string): string {
  const { data } = client().storage.from(PHOTOSTRIP_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

function rowToPlace(row: Record<string, unknown>): FoodPlace {
  const storagePath = String(row.storage_path ?? '')
  const lat = row.lat
  const lng = row.lng
  const { ratingA, ratingB } = normalizePlaceRatings({
    ratingA: row.rating_a != null ? Number(row.rating_a) : undefined,
    ratingB: row.rating_b != null ? Number(row.rating_b) : undefined,
    rating: Number(row.rating) || 0,
  })
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    status: row.status === 'want' ? 'want' : 'been',
    area: String(row.area ?? ''),
    cuisine: String(row.cuisine ?? ''),
    address: String(row.address ?? ''),
    notes: String(row.notes ?? ''),
    ratingA,
    ratingB,
    lat: typeof lat === 'number' ? lat : lat != null ? Number(lat) : null,
    lng: typeof lng === 'number' ? lng : lng != null ? Number(lng) : null,
    photoUrl: storagePath ? publicFileUrl(storagePath) : '',
    storagePath,
    visitedAt: String(row.visited_at ?? ''),
    createdAt: Number(row.created_at),
  }
}

export async function loadPlaces(coupleId: string): Promise<FoodPlace[]> {
  const { data, error } = await client()
    .from('food_places')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => rowToPlace(row))
}

export async function upsertFoodPlace(coupleId: string, place: FoodPlace): Promise<void> {
  const { error } = await client().from('food_places').upsert({
    id: place.id,
    couple_id: coupleId,
    name: place.name,
    status: place.status,
    area: place.area,
    cuisine: place.cuisine,
    address: place.address,
    notes: place.notes,
    rating: Math.max(place.ratingA, place.ratingB),
    rating_a: place.ratingA,
    rating_b: place.ratingB,
    lat: place.lat,
    lng: place.lng,
    storage_path: place.storagePath || null,
    visited_at: place.visitedAt || null,
    created_at: place.createdAt,
  })
  if (error) throw error
}

export async function deleteFoodPlaceCloud(coupleId: string, place: FoodPlace): Promise<void> {
  const db = client()
  if (place.storagePath) {
    await db.storage.from(PHOTOSTRIP_BUCKET).remove([place.storagePath])
  }
  const { error } = await db
    .from('food_places')
    .delete()
    .eq('id', place.id)
    .eq('couple_id', coupleId)
  if (error) throw error
}

export async function uploadPlacePhoto(
  coupleId: string,
  placeId: string,
  blob: Blob,
): Promise<{ storagePath: string; photoUrl: string }> {
  const storagePath = `${coupleId}/places/${placeId}.jpg`
  const { error } = await client().storage.from(PHOTOSTRIP_BUCKET).upload(storagePath, blob, {
    upsert: true,
    contentType: 'image/jpeg',
  })
  if (error) throw error
  return { storagePath, photoUrl: publicFileUrl(storagePath) }
}
