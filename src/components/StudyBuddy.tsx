import { useEffect, useMemo, useRef, useState } from 'react'
import { createId } from '../hooks/useStored'
import {
  askPip,
  buildPipContext,
  type PipMood,
  type StudyChatMessage,
} from '../lib/studyAgent'
import type { AcademicMaterial, AcademicModule, Carer } from '../types'
import { PipMascot } from './PipMascot'

interface StudyBuddyProps {
  open: boolean
  onOpen: () => void
  onClose: () => void
  modules: AcademicModule[]
  materials: AcademicMaterial[]
  names: { you: string; partner: string }
  isCloud: boolean
  defaultOwner?: Carer
}

const QUICK: { label: string; prompt: string }[] = [
  { label: 'Quiz me', prompt: 'Quiz me with 3 short questions from my materials. Wait for my answers.' },
  { label: 'Explain simply', prompt: 'Explain the most important idea from my materials in simple words.' },
  { label: 'What’s due?', prompt: 'What should I focus on based on due dates and unfinished work?' },
  { label: 'Summarize', prompt: 'Summarize the key points from my selected materials in bullet points.' },
]

export function StudyBuddy({
  open,
  onOpen,
  onClose,
  modules,
  materials,
  names,
  isCloud,
  defaultOwner = 'you',
}: StudyBuddyProps) {
  const [ownerFilter, setOwnerFilter] = useState<'you' | 'partner' | 'both'>(defaultOwner)
  const [moduleId, setModuleId] = useState<string | 'all'>('all')
  const [messages, setMessages] = useState<StudyChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [mood, setMood] = useState<PipMood>('wave')
  const listRef = useRef<HTMLDivElement>(null)

  const scopedModules = useMemo(() => {
    if (ownerFilter === 'both') return modules
    return modules.filter((module) => module.owner === ownerFilter)
  }, [modules, ownerFilter])

  useEffect(() => {
    if (moduleId === 'all') return
    if (!scopedModules.some((module) => module.id === moduleId)) {
      setModuleId('all')
    }
  }, [moduleId, scopedModules])

  useEffect(() => {
    if (!open) return
    setMood('wave')
    const timer = window.setTimeout(() => setMood('idle'), 1600)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open, busy])

  async function send(text: string) {
    const content = text.trim()
    if (!content || busy) return

    const userMessage: StudyChatMessage = {
      id: createId(),
      role: 'user',
      content,
      createdAt: Date.now(),
    }
    const history = [...messages, userMessage]
    setMessages(history)
    setDraft('')
    setError('')
    setBusy(true)
    setMood('think')

    try {
      const context = buildPipContext({
        modules,
        materials,
        moduleId,
        ownerFilter,
        names,
      })
      const { reply, mood: nextMood } = await askPip({
        message: content,
        context,
        names,
        history: messages,
      })
      setMessages((prev) => [
        ...prev,
        { id: createId(), role: 'assistant', content: reply, createdAt: Date.now() },
      ])
      setMood(nextMood)
      window.setTimeout(() => setMood('idle'), 2800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pip could not reply')
      setMood('curious')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {!open ? (
        <button type="button" className="pip-fab" onClick={onOpen} aria-label="Open Pip study buddy">
          <PipMascot mood="wave" size={64} />
          <span className="pip-fab__label">
            <strong>Pip</strong>
            <small>Study buddy</small>
          </span>
        </button>
      ) : null}

      {open ? (
        <div className="pip-sheet" role="dialog" aria-modal="true" aria-label="Pip study buddy">
          <div className="pip-sheet__panel">
            <header className="pip-sheet__head">
              <div className="pip-sheet__identity">
                <PipMascot mood={busy ? 'think' : mood} size={56} speaking={busy} />
                <div>
                  <p className="pip-sheet__eyebrow">Study buddy</p>
                  <h2>Pip</h2>
                  <p className="pip-sheet__status">
                    {busy ? 'Reading your notes…' : 'Ready to help you study'}
                  </p>
                </div>
              </div>
              <button type="button" className="acad-text-btn" onClick={onClose}>
                Close
              </button>
            </header>

            <div className="pip-filters">
              <label className="pip-filter">
                <span>Whose stuff</span>
                <select
                  value={ownerFilter}
                  onChange={(event) =>
                    setOwnerFilter(event.target.value as 'you' | 'partner' | 'both')
                  }
                >
                  <option value="you">{names.you}</option>
                  <option value="partner">{names.partner}</option>
                  <option value="both">Both of us</option>
                </select>
              </label>
              <label className="pip-filter">
                <span>Module</span>
                <select
                  value={moduleId}
                  onChange={(event) => setModuleId(event.target.value as string | 'all')}
                >
                  <option value="all">All selected</option>
                  {scopedModules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.code || module.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {!isCloud ? (
              <div className="pip-banner">
                Sign in and join your couple space on the <strong>Us</strong> tab so Pip can chat
                securely.
              </div>
            ) : null}

            <div className="pip-quick" aria-label="Quick prompts">
              {QUICK.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="pip-chip"
                  disabled={busy || !isCloud}
                  onClick={() => void send(item.prompt)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="pip-messages" ref={listRef}>
              {messages.length === 0 ? (
                <div className="pip-empty">
                  <PipMascot mood="happy" size={72} />
                  <p>
                    Hi, I’m <strong>Pip</strong> 🌱 Upload lecture PDFs or notes, then ask me to
                    quiz you, summarize, or plan what to revise.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`pip-bubble pip-bubble--${message.role}`}
                  >
                    {message.content}
                  </div>
                ))
              )}
              {busy ? (
                <div className="pip-bubble pip-bubble--assistant is-typing">
                  <span />
                  <span />
                  <span />
                </div>
              ) : null}
            </div>

            {error ? (
              <p className="pip-error" role="alert">
                {error}
              </p>
            ) : null}

            <form
              className="pip-composer"
              onSubmit={(event) => {
                event.preventDefault()
                void send(draft)
              }}
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask Pip anything about your modules…"
                disabled={busy || !isCloud}
                maxLength={2000}
              />
              <button
                type="submit"
                className="btn btn--primary acad-btn pip-send"
                disabled={busy || !isCloud || !draft.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
