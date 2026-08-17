import { isSupabaseConfigured, supabase } from './supabase'

export type PipMood = 'idle' | 'wave' | 'think' | 'happy' | 'quiz' | 'celebrate' | 'curious'

export interface StudyChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

export async function askPip(input: {
  message: string
  context: string
  names: { you: string; partner: string }
  history: StudyChatMessage[]
}): Promise<{ reply: string; mood: PipMood }> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Cloud sync is needed so Pip can think safely. Sign in on the Us tab first.')
  }

  const { data, error } = await supabase.functions.invoke('study-agent', {
    body: {
      message: input.message,
      context: input.context,
      names: input.names,
      history: input.history.map((item) => ({ role: item.role, content: item.content })),
    },
  })

  if (error) {
    const message = error.message || 'Pip could not reply'
    if (/Failed to send|FunctionsFetchError|not found|404/i.test(message)) {
      throw new Error(
        'Pip’s study brain isn’t deployed yet. Ask your app keeper to deploy the study-agent function and set ANTHROPIC_API_KEY.',
      )
    }
    throw new Error(message)
  }

  if (data?.error) throw new Error(String(data.error))
  const reply = String(data?.reply ?? '').trim()
  if (!reply) throw new Error('Pip went quiet. Try again.')

  const mood = (['quiz', 'celebrate', 'curious', 'happy'] as PipMood[]).includes(data?.mood)
    ? (data.mood as PipMood)
    : 'happy'

  return { reply, mood }
}

export function buildPipContext(input: {
  modules: Array<{ id: string; code: string; title: string; owner: string; term: string }>
  materials: Array<{
    moduleId: string
    title: string
    kind: string
    dueDate: string
    notes: string
    fileName: string
    extractedText: string
    done: boolean
  }>
  moduleId: string | 'all'
  ownerFilter: 'you' | 'partner' | 'both'
  names: { you: string; partner: string }
}) {
  const modules = input.modules.filter((module) => {
    if (input.moduleId !== 'all' && module.id !== input.moduleId) return false
    if (input.ownerFilter === 'both') return true
    return module.owner === input.ownerFilter
  })

  const moduleIds = new Set(modules.map((module) => module.id))
  const materials = input.materials.filter((item) => moduleIds.has(item.moduleId))

  if (modules.length === 0) {
    return 'No modules selected. Ask the student which course to open.'
  }

  const parts: string[] = [
    `Students: ${input.names.you} (you) and ${input.names.partner} (partner).`,
    `Focus filter: ${input.ownerFilter}.`,
    '',
  ]

  for (const module of modules) {
    const rows = materials.filter((item) => item.moduleId === module.id)
    parts.push(
      `## Module ${module.code || module.title}`,
      `Title: ${module.title}`,
      `Owner: ${module.owner === 'you' ? input.names.you : input.names.partner}`,
      module.term ? `Term: ${module.term}` : '',
      '',
    )
    if (rows.length === 0) {
      parts.push('(No materials yet for this module.)', '')
      continue
    }
    for (const row of rows.slice(0, 12)) {
      parts.push(
        `### ${row.kind}: ${row.title}`,
        row.dueDate ? `Due: ${row.dueDate}` : '',
        row.done ? 'Status: done' : 'Status: open',
        row.notes ? `Notes: ${row.notes}` : '',
        row.fileName ? `File: ${row.fileName}` : '',
        row.extractedText
          ? `Content:\n${row.extractedText.slice(0, 8000)}`
          : '(No extracted file text — use title/notes only.)',
        '',
      )
    }
  }

  return parts.filter(Boolean).join('\n').slice(0, 55_000)
}
