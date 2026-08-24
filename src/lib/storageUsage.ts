import { PHOTOSTRIP_BUCKET, supabase } from './supabase'

export const FILE_STORAGE_QUOTA_BYTES = 1024 * 1024 * 1024

export type StorageCategoryId =
  | 'photostrips'
  | 'academics'
  | 'places'
  | 'poses'
  | 'photos'
  | 'other'

export const STORAGE_CATEGORY_LABELS: Record<StorageCategoryId, string> = {
  photostrips: 'Photostrips',
  academics: 'Study Together',
  places: 'Places',
  poses: 'Booth poses',
  photos: 'Home & profiles',
  other: 'Other',
}

export interface StorageCategoryUsage {
  id: StorageCategoryId
  label: string
  bytes: number
  files: number
}

export interface CoupleStorageUsage {
  bytes: number
  files: number
  quotaBytes: number
  categories: StorageCategoryUsage[]
}

const PAGE_SIZE = 1000
const CATEGORY_ORDER: StorageCategoryId[] = [
  'photostrips',
  'academics',
  'places',
  'poses',
  'photos',
  'other',
]

function client() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

function categoryForPath(relativePath: string): StorageCategoryId {
  if (relativePath.startsWith('academics/')) return 'academics'
  if (relativePath.startsWith('places/')) return 'places'
  if (relativePath.startsWith('poses/')) return 'poses'
  if (relativePath.startsWith('home-photo-') || relativePath.startsWith('member-')) {
    return 'photos'
  }
  if (!relativePath.includes('/')) return 'photostrips'
  return 'other'
}

async function listPrefix(prefix: string): Promise<{ path: string; size: number }[]> {
  const out: { path: string; size: number }[] = []
  let offset = 0

  while (true) {
    const { data, error } = await client()
      .storage
      .from(PHOTOSTRIP_BUCKET)
      .list(prefix, {
        limit: PAGE_SIZE,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      })
    if (error) throw error

    const items = data ?? []
    for (const item of items) {
      if (!item.name || item.name.startsWith('.')) continue
      const nextPath = prefix ? `${prefix}/${item.name}` : item.name
      if (!item.id) {
        out.push(...(await listPrefix(nextPath)))
        continue
      }
      out.push({ path: nextPath, size: Number(item.metadata?.size ?? 0) })
    }

    if (items.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return out
}

export async function fetchCoupleStorageUsage(coupleId: string): Promise<CoupleStorageUsage> {
  const files = await listPrefix(coupleId)
  const totals = new Map<StorageCategoryId, { bytes: number; files: number }>()

  for (const file of files) {
    const relative = file.path.startsWith(`${coupleId}/`)
      ? file.path.slice(coupleId.length + 1)
      : file.path
    const id = categoryForPath(relative)
    const current = totals.get(id) ?? { bytes: 0, files: 0 }
    current.bytes += Number.isFinite(file.size) ? file.size : 0
    current.files += 1
    totals.set(id, current)
  }

  const categories = CATEGORY_ORDER
    .map((id) => {
      const current = totals.get(id) ?? { bytes: 0, files: 0 }
      return {
        id,
        label: STORAGE_CATEGORY_LABELS[id],
        bytes: current.bytes,
        files: current.files,
      }
    })
    .filter((row) => row.bytes > 0 || row.files > 0)

  return {
    bytes: files.reduce((sum, file) => sum + (Number.isFinite(file.size) ? file.size : 0), 0),
    files: files.length,
    quotaBytes: FILE_STORAGE_QUOTA_BYTES,
    categories,
  }
}

export function formatStorageBytes(bytes: number): string {
  if (bytes < 1024) return `${Math.max(0, Math.round(bytes))} B`
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`
  }
  if (bytes < 1024 * 1024 * 1024) {
    const mb = bytes / (1024 * 1024)
    return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
