import { createId } from './hooks/useStored'
import type { AcademicMaterial, AcademicModule, Carer, ModuleColor } from './types'
import { parseModuleColor } from './types'

const DB_NAME = 'cuddles-club-academics'
const DB_VERSION = 1
const MODULES = 'modules'
const MATERIALS = 'materials'
const FILES = 'files'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(MODULES)) {
        db.createObjectStore(MODULES, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(MATERIALS)) {
        const store = db.createObjectStore(MATERIALS, { keyPath: 'id' })
        store.createIndex('moduleId', 'moduleId', { unique: false })
      }
      if (!db.objectStoreNames.contains(FILES)) {
        db.createObjectStore(FILES, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open academics database'))
  })
}

function req<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Academics storage failed'))
  })
}

export async function listLocalModules(): Promise<AcademicModule[]> {
  const db = await openDb()
  const rows = await req(db.transaction(MODULES, 'readonly').objectStore(MODULES).getAll())
  return (rows as AcademicModule[])
    .map((row) => ({
      ...row,
      color: parseModuleColor(row.color, row.id),
    }))
    .sort((a, b) => a.title.localeCompare(b.title))
}

export async function listLocalMaterials(): Promise<AcademicMaterial[]> {
  const db = await openDb()
  const rows = await req(db.transaction(MATERIALS, 'readonly').objectStore(MATERIALS).getAll())
  return (rows as AcademicMaterial[])
    .map((row) => ({
      ...row,
      extractedText: row.extractedText ?? '',
      fileName: row.fileName ?? '',
      fileUrl: row.fileUrl ?? '',
      storagePath: row.storagePath ?? '',
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
}

export async function putLocalModule(module: AcademicModule): Promise<void> {
  const db = await openDb()
  await req(db.transaction(MODULES, 'readwrite').objectStore(MODULES).put(module))
}

export async function deleteLocalModule(id: string): Promise<void> {
  const db = await openDb()
  const materials = await listLocalMaterials()
  const related = materials.filter((item) => item.moduleId === id)
  const tx = db.transaction([MODULES, MATERIALS, FILES], 'readwrite')
  tx.objectStore(MODULES).delete(id)
  for (const item of related) {
    tx.objectStore(MATERIALS).delete(item.id)
    tx.objectStore(FILES).delete(item.id)
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Could not delete module'))
  })
}

export async function putLocalMaterial(material: AcademicMaterial): Promise<void> {
  const db = await openDb()
  const stored = { ...material, fileUrl: material.fileUrl.startsWith('blob:') ? '' : material.fileUrl }
  await req(db.transaction(MATERIALS, 'readwrite').objectStore(MATERIALS).put(stored))
}

export async function deleteLocalMaterial(id: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction([MATERIALS, FILES], 'readwrite')
  tx.objectStore(MATERIALS).delete(id)
  tx.objectStore(FILES).delete(id)
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Could not delete material'))
  })
}

export async function putLocalFile(id: string, blob: Blob): Promise<void> {
  const db = await openDb()
  await req(db.transaction(FILES, 'readwrite').objectStore(FILES).put({ id, blob }))
}

export async function getLocalFile(id: string): Promise<Blob | null> {
  const db = await openDb()
  const row = await req(db.transaction(FILES, 'readonly').objectStore(FILES).get(id))
  return (row as { id: string; blob: Blob } | undefined)?.blob ?? null
}

export function createModule(
  owner: Carer,
  input: { code: string; title: string; term?: string; color?: ModuleColor },
): AcademicModule {
  return {
    id: createId(),
    owner,
    code: input.code.trim().toUpperCase(),
    title: input.title.trim(),
    term: input.term?.trim() ?? '',
    color: parseModuleColor(input.color),
    createdAt: Date.now(),
  }
}

export function createMaterial(
  moduleId: string,
  input: {
    kind: AcademicMaterial['kind']
    title: string
    dueDate?: string
    notes?: string
  },
): AcademicMaterial {
  return {
    id: createId(),
    moduleId,
    kind: input.kind,
    title: input.title.trim(),
    dueDate: input.dueDate?.trim() ?? '',
    notes: input.notes?.trim() ?? '',
    fileName: '',
    fileUrl: '',
    storagePath: '',
    extractedText: '',
    done: false,
    createdAt: Date.now(),
  }
}
