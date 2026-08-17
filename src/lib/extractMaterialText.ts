import * as pdfjs from 'pdfjs-dist'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const MAX_CHARS = 48_000

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  const type = file.type

  if (
    type.startsWith('text/') ||
    name.endsWith('.txt') ||
    name.endsWith('.md') ||
    name.endsWith('.csv')
  ) {
    return truncate(await file.text())
  }

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return truncate(await extractPdfText(file))
  }

  // Office decks aren't extracted in-browser yet — title/notes still help the agent.
  return ''
}

async function extractPdfText(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjs.getDocument({ data }).promise
  const parts: string[] = []
  const pageLimit = Math.min(pdf.numPages, 40)

  for (let pageNum = 1; pageNum <= pageLimit; pageNum += 1) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const line = content.items
      .map((item) => ('str' in item ? String(item.str) : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (line) parts.push(line)
    if (parts.join('\n').length >= MAX_CHARS) break
  }

  return parts.join('\n\n')
}

function truncate(text: string) {
  const cleaned = text.replace(/\u0000/g, '').trim()
  if (cleaned.length <= MAX_CHARS) return cleaned
  return `${cleaned.slice(0, MAX_CHARS)}\n\n[Truncated for study agent]`
}

export function buildMaterialContext(input: {
  title: string
  kind: string
  notes: string
  dueDate: string
  fileName: string
  extractedText: string
}) {
  const header = [
    `Title: ${input.title}`,
    `Type: ${input.kind}`,
    input.dueDate ? `Due: ${input.dueDate}` : '',
    input.fileName ? `File: ${input.fileName}` : '',
    input.notes ? `Notes: ${input.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  if (!input.extractedText) return header
  return `${header}\n\n--- Material content ---\n${input.extractedText}`
}
