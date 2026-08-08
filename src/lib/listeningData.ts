import type { MemberSlot } from './coupleSlot'
import { supabase } from './supabase'
import type { ListeningStatus } from '../types'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

interface ListeningRow {
  couple_id: string
  slot: MemberSlot
  spotify_user_id: string | null
  display_name: string
  track_id: string | null
  track_name: string | null
  artists: string | null
  album_name: string | null
  album_art_url: string | null
  track_url: string | null
  is_playing: boolean
  updated_at: number
}

function rowToStatus(row: ListeningRow): ListeningStatus {
  return {
    slot: row.slot,
    spotifyUserId: row.spotify_user_id,
    displayName: row.display_name,
    trackId: row.track_id,
    trackName: row.track_name,
    artists: row.artists,
    albumName: row.album_name,
    albumArtUrl: row.album_art_url,
    trackUrl: row.track_url,
    isPlaying: row.is_playing,
    updatedAt: Number(row.updated_at),
  }
}

export async function fetchListeningStatuses(coupleId: string): Promise<ListeningStatus[]> {
  const client = requireClient()
  const { data, error } = await client
    .from('listening_status')
    .select('*')
    .eq('couple_id', coupleId)

  if (error) throw error
  return (data as ListeningRow[] | null)?.map(rowToStatus) ?? []
}

export async function upsertListeningStatus(
  coupleId: string,
  slot: MemberSlot,
  status: Omit<ListeningStatus, 'slot'>,
): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('listening_status').upsert(
    {
      couple_id: coupleId,
      slot,
      spotify_user_id: status.spotifyUserId,
      display_name: status.displayName,
      track_id: status.trackId,
      track_name: status.trackName,
      artists: status.artists,
      album_name: status.albumName,
      album_art_url: status.albumArtUrl,
      track_url: status.trackUrl,
      is_playing: status.isPlaying,
      updated_at: status.updatedAt,
    },
    { onConflict: 'couple_id,slot' },
  )
  if (error) throw error
}

export async function deleteListeningStatus(coupleId: string, slot: MemberSlot): Promise<void> {
  const client = requireClient()
  const { error } = await client
    .from('listening_status')
    .delete()
    .eq('couple_id', coupleId)
    .eq('slot', slot)
  if (error) throw error
}
