import { carerToSlot, slotToCarer, type MemberSlot } from './coupleSlot'
import { PHOTOSTRIP_BUCKET, supabase } from './supabase'
import type { AcademicMaterial, AcademicMaterialKind, AcademicModule, Carer } from '../types'

function client() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

function publicFileUrl(storagePath: string): string {
  const { data } = client().storage.from(PHOTOSTRIP_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

function rowToModule(row: Record<string, unknown>, mySlot: MemberSlot): AcademicModule {
  return {
    id: String(row.id),
    owner: slotToCarer(row.owner_slot as MemberSlot, mySlot),
    code: String(row.code ?? ''),
    title: String(row.title ?? ''),
    term: String(row.term ?? ''),
    createdAt: Number(row.created_at),
  }
}

function rowToMaterial(row: Record<string, unknown>): AcademicMaterial {
  const storagePath = String(row.storage_path ?? '')
  return {
    id: String(row.id),
    moduleId: String(row.module_id),
    kind: row.kind as AcademicMaterialKind,
    title: String(row.title ?? ''),
    dueDate: String(row.due_date ?? ''),
    notes: String(row.notes ?? ''),
    fileName: String(row.file_name ?? ''),
    fileUrl: storagePath ? publicFileUrl(storagePath) : '',
    storagePath,
    extractedText: String(row.extracted_text ?? ''),
    done: Boolean(row.done),
    createdAt: Number(row.created_at),
  }
}

export async function loadAcademics(
  coupleId: string,
  mySlot: MemberSlot,
): Promise<{ modules: AcademicModule[]; materials: AcademicMaterial[] }> {
  const db = client()
  const [modulesRes, materialsRes] = await Promise.all([
    db.from('academic_modules').select('*').eq('couple_id', coupleId),
    db.from('academic_materials').select('*').eq('couple_id', coupleId),
  ])
  if (modulesRes.error) throw modulesRes.error
  if (materialsRes.error) throw materialsRes.error

  const modules = (modulesRes.data ?? [])
    .map((row) => rowToModule(row, mySlot))
    .sort((a, b) => a.title.localeCompare(b.title))
  const materials = (materialsRes.data ?? [])
    .map((row) => rowToMaterial(row))
    .sort((a, b) => b.createdAt - a.createdAt)

  return { modules, materials }
}

export async function upsertAcademicModule(
  coupleId: string,
  module: AcademicModule,
  mySlot: MemberSlot,
): Promise<void> {
  const { error } = await client().from('academic_modules').upsert({
    id: module.id,
    couple_id: coupleId,
    owner_slot: carerToSlot(module.owner, mySlot),
    code: module.code,
    title: module.title,
    term: module.term,
    created_at: module.createdAt,
  })
  if (error) throw error
}

export async function deleteAcademicModuleCloud(coupleId: string, moduleId: string): Promise<void> {
  const db = client()
  const { data: materials, error: listError } = await db
    .from('academic_materials')
    .select('id, storage_path')
    .eq('couple_id', coupleId)
    .eq('module_id', moduleId)
  if (listError) throw listError

  const paths = (materials ?? [])
    .map((row) => row.storage_path as string | null)
    .filter((path): path is string => Boolean(path))
  if (paths.length) {
    await db.storage.from(PHOTOSTRIP_BUCKET).remove(paths)
  }

  const { error } = await db.from('academic_modules').delete().eq('id', moduleId)
  if (error) throw error
}

export async function upsertAcademicMaterial(
  coupleId: string,
  material: AcademicMaterial,
): Promise<void> {
  const { error } = await client().from('academic_materials').upsert({
    id: material.id,
    couple_id: coupleId,
    module_id: material.moduleId,
    kind: material.kind,
    title: material.title,
    due_date: material.dueDate || null,
    notes: material.notes,
    file_name: material.fileName || null,
    storage_path: material.storagePath || null,
    extracted_text: material.extractedText || '',
    done: material.done,
    created_at: material.createdAt,
  })
  if (error) throw error
}

export async function deleteAcademicMaterialCloud(
  coupleId: string,
  material: AcademicMaterial,
): Promise<void> {
  const db = client()
  if (material.storagePath) {
    await db.storage.from(PHOTOSTRIP_BUCKET).remove([material.storagePath])
  }
  const { error } = await db
    .from('academic_materials')
    .delete()
    .eq('id', material.id)
    .eq('couple_id', coupleId)
  if (error) throw error
}

export async function uploadAcademicFile(
  coupleId: string,
  materialId: string,
  file: File,
): Promise<{ storagePath: string; fileUrl: string; fileName: string }> {
  const safeName = file.name.replace(/[^\w.\-()+ ]+/g, '_').slice(0, 120)
  const storagePath = `${coupleId}/academics/${materialId}-${safeName}`
  const { error } = await client().storage.from(PHOTOSTRIP_BUCKET).upload(storagePath, file, {
    upsert: true,
    contentType: file.type || 'application/octet-stream',
  })
  if (error) throw error
  return {
    storagePath,
    fileUrl: publicFileUrl(storagePath),
    fileName: file.name,
  }
}

export type { Carer }
