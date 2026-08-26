import { carerToSlot, slotToCarer, type MemberSlot } from './coupleSlot'
import { supabase } from './supabase'
import type { PoopLog } from '../types'

function client() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

function rowToLog(row: Record<string, unknown>, mySlot: MemberSlot): PoopLog {
  return {
    id: String(row.id),
    owner: slotToCarer(row.owner_slot as MemberSlot, mySlot),
    createdAt: Number(row.created_at),
  }
}

export async function loadPoopLogs(coupleId: string, mySlot: MemberSlot): Promise<PoopLog[]> {
  const { data, error } = await client()
    .from('poop_logs')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => rowToLog(row, mySlot))
}

export async function insertPoopLog(
  coupleId: string,
  log: PoopLog,
  mySlot: MemberSlot,
): Promise<void> {
  const { error } = await client().from('poop_logs').insert({
    id: log.id,
    couple_id: coupleId,
    owner_slot: carerToSlot(log.owner, mySlot),
    created_at: log.createdAt,
  })
  if (error) throw error
}

export async function deletePoopLog(coupleId: string, id: string): Promise<void> {
  const { error } = await client()
    .from('poop_logs')
    .delete()
    .eq('id', id)
    .eq('couple_id', coupleId)
  if (error) throw error
}
