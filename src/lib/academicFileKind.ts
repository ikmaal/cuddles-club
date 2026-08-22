export type AcademicPreviewKind = 'pdf' | 'image' | 'text' | 'other'

export function academicPreviewKind(fileName: string): AcademicPreviewKind {
  const name = fileName.trim().toLowerCase()
  if (name.endsWith('.pdf')) return 'pdf'
  if (/\.(png|jpe?g|webp|gif)$/.test(name)) return 'image'
  if (name.endsWith('.txt')) return 'text'
  return 'other'
}

export function academicFileLabel(fileName: string): string {
  const ext = fileName.trim().split('.').pop()?.toUpperCase()
  if (!ext || ext === fileName.trim().toUpperCase()) return 'File'
  return ext
}
