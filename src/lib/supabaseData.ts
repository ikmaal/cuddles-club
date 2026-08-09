import { STARTER_BUCKET, STARTER_IDEAS } from '../data'
import {
  moodEntryToRow,
  moodRowToEntry,
  profileFromCouple,
  profileToCoupleNames,
  slotToCarer,
  type MemberSlot,
} from './coupleSlot'
import { PHOTOSTRIP_BUCKET, supabase } from './supabase'
import type {
  AnswerEntry,
  BoothPosePhoto,
  BucketItem,
  CatState,
  Countdown,
  CoupleProfile,
  DateIdea,
  MoodEntry,
  Note,
  Photostrip,
} from '../types'
import { createId } from '../hooks/useStored'
import { defaultCat } from '../hooks/useCat'

export interface CoupleRow {
  id: string
  invite_code: string
  member_a_name: string
  member_b_name: string
  since: string | null
  home_photo_path?: string | null
  home_photo_updated_at?: number | null
}

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export async function fetchMembership(userId: string) {
  const client = requireClient()
  const { data, error } = await client
    .from('couple_members')
    .select('couple_id, slot, couples(id, invite_code, member_a_name, member_b_name, since, home_photo_path, home_photo_updated_at)')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const coupleRaw = data.couples
  const couple = (Array.isArray(coupleRaw) ? coupleRaw[0] : coupleRaw) as CoupleRow | null
  if (!couple) return null
  return {
    coupleId: couple.id,
    slot: data.slot as MemberSlot,
    couple,
    inviteCode: couple.invite_code,
  }
}

export async function createCoupleSpace() {
  const client = requireClient()
  const { data, error } = await client.rpc('create_couple_space')
  if (error) throw error
  return data as CoupleRow
}

export async function joinCoupleSpace(inviteCode: string) {
  const client = requireClient()
  const { data, error } = await client.rpc('join_couple_space', {
    p_invite_code: inviteCode.trim().toUpperCase(),
  })
  if (error) throw error
  return data as CoupleRow
}

export async function updateCoupleProfile(
  coupleId: string,
  profile: CoupleProfile,
  mySlot: MemberSlot,
) {
  const client = requireClient()
  const names = profileToCoupleNames(profile, mySlot)
  const { error } = await client
    .from('couples')
    .update({
      member_a_name: names.member_a_name,
      member_b_name: names.member_b_name,
      since: names.since,
    })
    .eq('id', coupleId)
  if (error) throw error
}

export function coupleToProfile(couple: CoupleRow, mySlot: MemberSlot): CoupleProfile {
  return profileFromCouple(
    couple.member_a_name,
    couple.member_b_name,
    couple.since,
    mySlot,
  )
}

export async function loadAllCoupleData(coupleId: string, mySlot: MemberSlot) {
  const client = requireClient()

  const [
    notesRes,
    bucketRes,
    ideasRes,
    eventsRes,
    moodsRes,
    answersRes,
    catRes,
    stripsRes,
  ] = await Promise.all([
    client.from('notes').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }),
    client.from('bucket_items').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }),
    client.from('date_ideas').select('*').eq('couple_id', coupleId),
    client.from('countdowns').select('*').eq('couple_id', coupleId),
    client.from('mood_entries').select('*').eq('couple_id', coupleId),
    client.from('daily_answers').select('*').eq('couple_id', coupleId).order('answered_at', { ascending: false }),
    client.from('cat_states').select('state').eq('couple_id', coupleId).maybeSingle(),
    client.from('photostrips').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }),
  ])

  for (const res of [notesRes, bucketRes, ideasRes, eventsRes, moodsRes, answersRes, catRes, stripsRes]) {
    if (res.error) throw res.error
  }

  const notes: Note[] = (notesRes.data ?? []).map((row) => ({
    id: row.id,
    text: row.text,
    author: slotToCarer(row.author_slot as MemberSlot, mySlot),
    createdAt: Number(row.created_at),
  }))

  const bucket: BucketItem[] = (bucketRes.data ?? []).map((row) => ({
    id: row.id,
    text: row.text,
    done: row.done,
    createdAt: Number(row.created_at),
    doneAt: row.done_at ? Number(row.done_at) : undefined,
  }))

  const ideas: DateIdea[] = (ideasRes.data ?? []).map((row) => ({
    id: row.id,
    text: row.text,
  }))

  const events: Countdown[] = (eventsRes.data ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    date: row.date,
    repeatsYearly: row.repeats_yearly,
  }))

  const moods: MoodEntry[] = (moodsRes.data ?? []).map((row) =>
    moodRowToEntry(row.day, row.mood_a, row.mood_b, mySlot),
  )

  const answers: AnswerEntry[] = (answersRes.data ?? []).map((row) => ({
    id: row.day,
    question: row.question,
    you: mySlot === 'a' ? row.answer_a : row.answer_b,
    partner: mySlot === 'a' ? row.answer_b : row.answer_a,
    answeredAt: Number(row.answered_at),
  }))

  const cat: CatState = {
    ...defaultCat,
    ...((catRes.data?.state as Partial<CatState> | undefined) ?? {}),
  }

  const strips: Photostrip[] = await Promise.all(
    (stripsRes.data ?? []).map(async (row) => ({
      id: row.id,
      title: row.title,
      createdAt: Number(row.created_at),
      image: await publicStripUrl(row.storage_path),
    })),
  )

  return { notes, bucket, ideas, events, moods, answers, cat, strips }
}

export async function publicStripUrl(storagePath: string): Promise<string> {
  const client = requireClient()
  const { data } = client.storage.from(PHOTOSTRIP_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

export function homePhotoPublicUrl(storagePath: string, updatedAt: number | null | undefined): string {
  const client = requireClient()
  const { data } = client.storage.from(PHOTOSTRIP_BUCKET).getPublicUrl(storagePath)
  const stamp = updatedAt ? `?t=${updatedAt}` : ''
  return `${data.publicUrl}${stamp}`
}

export async function fetchHomePhotoUrl(coupleId: string): Promise<string> {
  const client = requireClient()
  const { data, error } = await client
    .from('couples')
    .select('home_photo_path, home_photo_updated_at')
    .eq('id', coupleId)
    .maybeSingle()
  if (error) throw error
  if (!data?.home_photo_path) return ''
  return homePhotoPublicUrl(data.home_photo_path, data.home_photo_updated_at)
}

export async function uploadHomePhoto(coupleId: string, imageDataUrl: string): Promise<string> {
  const client = requireClient()
  const updatedAt = Date.now()
  // Unique path each save so CDN/browser caches cannot keep showing the previous photo.
  const storagePath = `${coupleId}/home-photo-${updatedAt}.jpg`
  const blob = dataUrlToBlob(imageDataUrl)

  const { data: existing, error: existingError } = await client
    .from('couples')
    .select('home_photo_path')
    .eq('id', coupleId)
    .maybeSingle()
  if (existingError) throw existingError

  const { error: uploadError } = await client.storage
    .from(PHOTOSTRIP_BUCKET)
    .upload(storagePath, blob, {
      contentType: 'image/jpeg',
      upsert: false,
      cacheControl: '3600',
    })
  if (uploadError) throw uploadError

  const { error } = await client
    .from('couples')
    .update({
      home_photo_path: storagePath,
      home_photo_updated_at: updatedAt,
    })
    .eq('id', coupleId)
  if (error) {
    await client.storage.from(PHOTOSTRIP_BUCKET).remove([storagePath])
    throw error
  }

  const previous = existing?.home_photo_path
  if (previous && previous !== storagePath) {
    await client.storage.from(PHOTOSTRIP_BUCKET).remove([previous])
  }

  return homePhotoPublicUrl(storagePath, updatedAt)
}

export async function clearHomePhoto(coupleId: string): Promise<void> {
  const client = requireClient()
  const { data, error: readError } = await client
    .from('couples')
    .select('home_photo_path')
    .eq('id', coupleId)
    .maybeSingle()
  if (readError) throw readError

  if (data?.home_photo_path) {
    await client.storage.from(PHOTOSTRIP_BUCKET).remove([data.home_photo_path])
  }

  const { error } = await client
    .from('couples')
    .update({
      home_photo_path: null,
      home_photo_updated_at: null,
    })
    .eq('id', coupleId)
  if (error) throw error
}

export async function seedCoupleDefaults(coupleId: string) {
  const client = requireClient()
  const bucket = STARTER_BUCKET.map((text, index) => ({
    id: `seed-bucket-${index}`,
    couple_id: coupleId,
    text,
    done: false,
    created_at: Date.now(),
  }))
  const ideas = STARTER_IDEAS.map((text, index) => ({
    id: `seed-idea-${index}`,
    couple_id: coupleId,
    text,
  }))
  await client.from('bucket_items').upsert(bucket, { onConflict: 'id' })
  await client.from('date_ideas').upsert(ideas, { onConflict: 'id' })
}

export async function upsertNote(coupleId: string, note: Note, mySlot: MemberSlot) {
  const client = requireClient()
  const { error } = await client.from('notes').upsert({
    id: note.id,
    couple_id: coupleId,
    author_slot: note.author === 'you' ? mySlot : mySlot === 'a' ? 'b' : 'a',
    text: note.text,
    created_at: note.createdAt,
  })
  if (error) throw error
}

export async function deleteNote(id: string) {
  const client = requireClient()
  const { error } = await client.from('notes').delete().eq('id', id)
  if (error) throw error
}

export async function upsertBucketItem(coupleId: string, item: BucketItem) {
  const client = requireClient()
  const { error } = await client.from('bucket_items').upsert({
    id: item.id,
    couple_id: coupleId,
    text: item.text,
    done: item.done,
    created_at: item.createdAt,
    done_at: item.doneAt ?? null,
  })
  if (error) throw error
}

export async function deleteBucketItem(id: string) {
  const client = requireClient()
  const { error } = await client.from('bucket_items').delete().eq('id', id)
  if (error) throw error
}

export async function upsertIdea(coupleId: string, idea: DateIdea) {
  const client = requireClient()
  const { error } = await client.from('date_ideas').upsert({
    id: idea.id,
    couple_id: coupleId,
    text: idea.text,
  })
  if (error) throw error
}

export async function deleteIdea(id: string) {
  const client = requireClient()
  const { error } = await client.from('date_ideas').delete().eq('id', id)
  if (error) throw error
}

export async function upsertCountdown(coupleId: string, event: Countdown) {
  const client = requireClient()
  const { error } = await client.from('countdowns').upsert({
    id: event.id,
    couple_id: coupleId,
    label: event.label,
    date: event.date,
    repeats_yearly: event.repeatsYearly,
  })
  if (error) throw error
}

export async function deleteCountdown(id: string) {
  const client = requireClient()
  const { error } = await client.from('countdowns').delete().eq('id', id)
  if (error) throw error
}

export async function upsertMoodEntry(coupleId: string, entry: MoodEntry, mySlot: MemberSlot) {
  const client = requireClient()
  const row = moodEntryToRow(entry, mySlot)
  const { error } = await client.from('mood_entries').upsert({
    couple_id: coupleId,
    day: row.day,
    mood_a: row.mood_a,
    mood_b: row.mood_b,
  })
  if (error) throw error
}

export async function upsertAnswer(coupleId: string, answer: AnswerEntry, mySlot: MemberSlot) {
  const client = requireClient()
  const { error } = await client.from('daily_answers').upsert({
    couple_id: coupleId,
    day: answer.id,
    question: answer.question,
    answer_a: mySlot === 'a' ? answer.you : answer.partner,
    answer_b: mySlot === 'b' ? answer.you : answer.partner,
    answered_at: answer.answeredAt,
  })
  if (error) throw error
}

export async function saveCatState(coupleId: string, cat: CatState) {
  const client = requireClient()
  const { error } = await client.from('cat_states').upsert({
    couple_id: coupleId,
    state: cat,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const bytes = atob(data)
  const buffer = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i += 1) {
    buffer[i] = bytes.charCodeAt(i)
  }
  return new Blob([buffer], { type: mime })
}

export async function uploadPhotostrip(
  coupleId: string,
  id: string,
  title: string,
  imageDataUrl: string,
  createdAt: number,
): Promise<Photostrip> {
  const client = requireClient()
  const storagePath = `${coupleId}/${id}.jpg`
  const blob = dataUrlToBlob(imageDataUrl)

  const { error: uploadError } = await client.storage
    .from(PHOTOSTRIP_BUCKET)
    .upload(storagePath, blob, { contentType: 'image/jpeg', upsert: true })
  if (uploadError) throw uploadError

  const { error } = await client.from('photostrips').upsert({
    id,
    couple_id: coupleId,
    title,
    storage_path: storagePath,
    created_at: createdAt,
  })
  if (error) throw error

  return {
    id,
    title,
    createdAt,
    image: await publicStripUrl(storagePath),
  }
}

export async function uploadPhotostripFile(
  coupleId: string,
  file: File,
  title: string,
  takenAt = Date.now(),
): Promise<Photostrip> {
  const id = createId()
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
  return uploadPhotostrip(coupleId, id, title, dataUrl, takenAt)
}

export async function renamePhotostrip(id: string, title: string) {
  const client = requireClient()
  const { error } = await client.from('photostrips').update({ title }).eq('id', id)
  if (error) throw error
}

export async function deletePhotostrip(strip: Photostrip, coupleId: string) {
  const client = requireClient()
  const storagePath = `${coupleId}/${strip.id}.jpg`
  await client.storage.from(PHOTOSTRIP_BUCKET).remove([storagePath])
  const { error } = await client.from('photostrips').delete().eq('id', strip.id)
  if (error) throw error
}

export async function listBoothPoses(coupleId: string): Promise<BoothPosePhoto[]> {
  const client = requireClient()
  const { data, error } = await client
    .from('booth_poses')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
  if (error) throw error

  return Promise.all(
    (data ?? []).map(async (row) => ({
      id: row.id as string,
      createdAt: Number(row.created_at),
      image: await publicStripUrl(row.storage_path as string),
    })),
  )
}

export async function uploadBoothPose(
  coupleId: string,
  id: string,
  imageDataUrl: string,
  createdAt: number,
): Promise<BoothPosePhoto> {
  const client = requireClient()
  const storagePath = `${coupleId}/poses/${id}.jpg`
  const blob = dataUrlToBlob(imageDataUrl)

  const { error: uploadError } = await client.storage
    .from(PHOTOSTRIP_BUCKET)
    .upload(storagePath, blob, { contentType: 'image/jpeg', upsert: true })
  if (uploadError) throw uploadError

  const { error } = await client.from('booth_poses').upsert({
    id,
    couple_id: coupleId,
    storage_path: storagePath,
    created_at: createdAt,
  })
  if (error) throw error

  return {
    id,
    createdAt,
    image: await publicStripUrl(storagePath),
  }
}

export async function uploadBoothPoseFile(
  coupleId: string,
  file: File,
): Promise<BoothPosePhoto> {
  const { compressImage } = await import('../stripsDb')
  const id = createId()
  const dataUrl = await compressImage(file, 1200, 0.84)
  return uploadBoothPose(coupleId, id, dataUrl, Date.now())
}

export async function deleteBoothPose(pose: BoothPosePhoto, coupleId: string) {
  const client = requireClient()
  const storagePath = `${coupleId}/poses/${pose.id}.jpg`
  await client.storage.from(PHOTOSTRIP_BUCKET).remove([storagePath])
  const { error } = await client.from('booth_poses').delete().eq('id', pose.id)
  if (error) throw error
}
