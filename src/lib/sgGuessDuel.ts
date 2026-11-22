import type { MemberSlot } from './coupleSlot'
import {
  distanceMeters,
  scoreFromDistance,
  type LatLng,
} from './geoguessrMath'
import { supabase } from './supabase'
import type { StreetViewRoundLocation } from './singaporeGeoguess'
import { SG_GUESS_ROUND_COUNT, SG_GUESS_ROUND_SECONDS } from './singaporeGeoguess'

export type DuelStatus = 'lobby' | 'loading' | 'playing' | 'reveal' | 'summary' | 'aborted'

export type DuelLastRound = {
  round: number
  answer: LatLng
  a: { guess: LatLng | null; distanceM: number; score: number }
  b: { guess: LatLng | null; distanceM: number; score: number }
}

export type SgGuessDuelRow = {
  id: string
  couple_id: string
  status: DuelStatus
  round_index: number
  host_slot: MemberSlot
  ready_a: boolean
  ready_b: boolean
  guess_deadline_at: string | null
  answer_lat: number | null
  answer_lng: number | null
  pano_id: string | null
  start_heading: number | null
  guess_a_lat: number | null
  guess_a_lng: number | null
  guess_b_lat: number | null
  guess_b_lng: number | null
  score_a: number
  score_b: number
  last_round: DuelLastRound | null
}

function client() {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED')
  return supabase
}

export function duelLocation(row: SgGuessDuelRow | null): StreetViewRoundLocation | null {
  if (!row || row.answer_lat == null || row.answer_lng == null) return null
  return {
    lat: row.answer_lat,
    lng: row.answer_lng,
    panoId: row.pano_id ?? undefined,
    startHeading: row.start_heading != null ? Math.round(row.start_heading) : 0,
  }
}

export function guessForSlot(row: SgGuessDuelRow, slot: MemberSlot): LatLng | null {
  const lat = slot === 'a' ? row.guess_a_lat : row.guess_b_lat
  const lng = slot === 'a' ? row.guess_a_lng : row.guess_b_lng
  if (lat == null || lng == null) return null
  return { lat, lng }
}

export function duelSecondsLeft(row: SgGuessDuelRow | null, nowMs = Date.now()): number {
  if (!row?.guess_deadline_at || row.status !== 'playing') return SG_GUESS_ROUND_SECONDS
  const end = new Date(row.guess_deadline_at).getTime()
  return Math.max(0, Math.ceil((end - nowMs) / 1000))
}

export function bothGuessesIn(row: SgGuessDuelRow): boolean {
  const a = row.guess_a_lat != null && row.guess_a_lng != null
  const b = row.guess_b_lat != null && row.guess_b_lng != null
  return a && b
}

export function slotSubmitted(row: SgGuessDuelRow, slot: MemberSlot): boolean {
  return guessForSlot(row, slot) != null
}

function clearGuessFields(): Partial<SgGuessDuelRow> {
  return {
    guess_a_lat: null,
    guess_a_lng: null,
    guess_b_lat: null,
    guess_b_lng: null,
    guess_deadline_at: null,
    answer_lat: null,
    answer_lng: null,
    pano_id: null,
    start_heading: null,
    last_round: null,
  }
}

export async function fetchActiveDuel(coupleId: string): Promise<SgGuessDuelRow | null> {
  const { data, error } = await client()
    .from('sg_guess_duels')
    .select('*')
    .eq('couple_id', coupleId)
    .not('status', 'in', '(summary,aborted)')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as SgGuessDuelRow | null
}

export async function createDuelLobby(coupleId: string, hostSlot: MemberSlot): Promise<SgGuessDuelRow> {
  const existing = await fetchActiveDuel(coupleId)
  if (existing) return existing

  const readyKey = hostSlot === 'a' ? 'ready_a' : 'ready_b'

  const { data, error } = await client()
    .from('sg_guess_duels')
    .insert({
      couple_id: coupleId,
      host_slot: hostSlot,
      status: 'lobby',
      [readyKey]: true,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as SgGuessDuelRow
}

export async function setDuelReady(duelId: string, slot: MemberSlot, ready: boolean): Promise<void> {
  const patch = slot === 'a' ? { ready_a: ready } : { ready_b: ready }
  const { error } = await client()
    .from('sg_guess_duels')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', duelId)
  if (error) throw error
}

export async function abortDuel(duelId: string): Promise<void> {
  const { error } = await client()
    .from('sg_guess_duels')
    .update({ status: 'aborted', updated_at: new Date().toISOString() })
    .eq('id', duelId)
  if (error) throw error
}

export async function startDuelMatch(duelId: string): Promise<void> {
  const { error } = await client()
    .from('sg_guess_duels')
    .update({
      status: 'loading',
      round_index: 0,
      score_a: 0,
      score_b: 0,
      ...clearGuessFields(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', duelId)
  if (error) throw error
}

export async function publishDuelRound(
  duelId: string,
  roundIndex: number,
  location: StreetViewRoundLocation,
): Promise<void> {
  const deadline = new Date(Date.now() + SG_GUESS_ROUND_SECONDS * 1000).toISOString()
  const { error } = await client()
    .from('sg_guess_duels')
    .update({
      status: 'playing',
      round_index: roundIndex,
      answer_lat: location.lat,
      answer_lng: location.lng,
      pano_id: location.panoId ?? null,
      start_heading: location.startHeading,
      guess_deadline_at: deadline,
      guess_a_lat: null,
      guess_a_lng: null,
      guess_b_lat: null,
      guess_b_lng: null,
      last_round: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', duelId)
  if (error) throw error
}

export async function submitDuelGuess(duelId: string, slot: MemberSlot, guess: LatLng | null): Promise<void> {
  const patch =
    slot === 'a'
      ? { guess_a_lat: guess?.lat ?? null, guess_a_lng: guess?.lng ?? null }
      : { guess_b_lat: guess?.lat ?? null, guess_b_lng: guess?.lng ?? null }

  const { error } = await client()
    .from('sg_guess_duels')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', duelId)
  if (error) throw error
}

export function buildRoundReveal(row: SgGuessDuelRow): DuelLastRound | null {
  const answer = duelLocation(row)
  if (!answer) return null

  const guessA: LatLng | null =
    row.guess_a_lat != null && row.guess_a_lng != null
      ? { lat: row.guess_a_lat, lng: row.guess_a_lng }
      : null
  const guessB: LatLng | null =
    row.guess_b_lat != null && row.guess_b_lng != null
      ? { lat: row.guess_b_lat, lng: row.guess_b_lng }
      : null

  const distA = guessA ? distanceMeters(guessA, answer) : Number.POSITIVE_INFINITY
  const distB = guessB ? distanceMeters(guessB, answer) : Number.POSITIVE_INFINITY

  return {
    round: row.round_index,
    answer: { lat: answer.lat, lng: answer.lng },
    a: { guess: guessA, distanceM: distA, score: guessA ? scoreFromDistance(distA) : 0 },
    b: { guess: guessB, distanceM: distB, score: guessB ? scoreFromDistance(distB) : 0 },
  }
}

export async function finalizeDuelRound(duelId: string, row: SgGuessDuelRow): Promise<SgGuessDuelRow> {
  const last = buildRoundReveal(row)
  if (!last) throw new Error('MISSING_ANSWER')

  const { data, error } = await client()
    .from('sg_guess_duels')
    .update({
      status: 'reveal',
      score_a: row.score_a + last.a.score,
      score_b: row.score_b + last.b.score,
      last_round: last,
      guess_deadline_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', duelId)
    .select('*')
    .single()

  if (error) throw error
  return data as SgGuessDuelRow
}

export async function nextDuelRound(duelId: string, currentRoundIndex: number): Promise<'loading' | 'summary'> {
  const next = currentRoundIndex + 1
  if (next >= SG_GUESS_ROUND_COUNT) {
    const { error } = await client()
      .from('sg_guess_duels')
      .update({ status: 'summary', updated_at: new Date().toISOString() })
      .eq('id', duelId)
    if (error) throw error
    return 'summary'
  }

  const { error } = await client()
    .from('sg_guess_duels')
    .update({
      status: 'loading',
      round_index: next,
      ...clearGuessFields(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', duelId)

  if (error) throw error
  return 'loading'
}