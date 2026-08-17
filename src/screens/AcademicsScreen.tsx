import { useMemo, useRef, useState } from 'react'
import { ScreenHeader } from '../components/ScreenHeader'
import { ScrollRegion } from '../components/ScrollRegion'
import { StudyBuddy } from '../components/StudyBuddy'
import type { useAcademics } from '../hooks/useAcademics'
import type { AcademicMaterial, AcademicMaterialKind, AcademicModule, Carer } from '../types'

type AcademicsApi = ReturnType<typeof useAcademics>

interface AcademicsScreenProps extends AcademicsApi {
  onBack: () => void
}

type View = { mode: 'home' } | { mode: 'module'; moduleId: string }

const KINDS: { id: AcademicMaterialKind; label: string }[] = [
  { id: 'lecture', label: 'Lectures' },
  { id: 'tutorial', label: 'Tutorials' },
  { id: 'assignment', label: 'Assignments' },
  { id: 'notes', label: 'Notes' },
]

function kindLabel(kind: AcademicMaterialKind) {
  return KINDS.find((item) => item.id === kind)?.label.replace(/s$/, '') ?? kind
}

function formatDue(dueDate: string) {
  if (!dueDate) return ''
  const date = new Date(`${dueDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return dueDate
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function dueTone(dueDate: string, done: boolean) {
  if (!dueDate || done) return ''
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const due = new Date(`${dueDate}T12:00:00`)
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (diff < 0) return 'is-overdue'
  if (diff <= 3) return 'is-soon'
  return ''
}

export function AcademicsScreen({
  modules,
  materials,
  ready,
  busy,
  error,
  names,
  isCloud,
  onBack,
  setError,
  addModule,
  removeModule,
  addMaterial,
  toggleMaterialDone,
  removeMaterial,
}: AcademicsScreenProps) {
  const [owner, setOwner] = useState<Carer>('you')
  const [view, setView] = useState<View>({ mode: 'home' })
  const [buddyOpen, setBuddyOpen] = useState(false)
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [moduleCode, setModuleCode] = useState('')
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleTerm, setModuleTerm] = useState('')
  const [materialKind, setMaterialKind] = useState<AcademicMaterialKind>('lecture')
  const [materialTitle, setMaterialTitle] = useState('')
  const [materialDue, setMaterialDue] = useState('')
  const [materialNotes, setMaterialNotes] = useState('')
  const [materialFile, setMaterialFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const ownedModules = useMemo(
    () => modules.filter((item) => item.owner === owner),
    [modules, owner],
  )

  const activeModule =
    view.mode === 'module' ? modules.find((item) => item.id === view.moduleId) ?? null : null

  const moduleMaterials = useMemo(() => {
    if (!activeModule) return []
    return materials.filter((item) => item.moduleId === activeModule.id)
  }, [activeModule, materials])

  const upcoming = useMemo(() => {
    const moduleIds = new Set(ownedModules.map((item) => item.id))
    return materials
      .filter((item) => moduleIds.has(item.moduleId) && item.dueDate && !item.done)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5)
  }, [materials, ownedModules])

  function resetModuleForm() {
    setModuleCode('')
    setModuleTitle('')
    setModuleTerm('')
    setShowModuleForm(false)
  }

  function resetMaterialForm() {
    setMaterialKind('lecture')
    setMaterialTitle('')
    setMaterialDue('')
    setMaterialNotes('')
    setMaterialFile(null)
    if (fileRef.current) fileRef.current.value = ''
    setShowMaterialForm(false)
  }

  async function submitModule() {
    setError('')
    const created = await addModule(owner, {
      code: moduleCode,
      title: moduleTitle,
      term: moduleTerm,
    })
    if (created) {
      resetModuleForm()
      setView({ mode: 'module', moduleId: created.id })
    }
  }

  async function submitMaterial() {
    if (!activeModule) return
    setError('')
    const created = await addMaterial(activeModule.id, {
      kind: materialKind,
      title: materialTitle,
      dueDate: materialDue,
      notes: materialNotes,
      file: materialFile,
    })
    if (created) resetMaterialForm()
  }

  async function handleDeleteModule(module: AcademicModule) {
    if (!window.confirm(`Remove ${module.code || module.title}? All materials will be deleted.`)) {
      return
    }
    const ok = await removeModule(module.id)
    if (ok) setView({ mode: 'home' })
  }

  async function handleDeleteMaterial(item: AcademicMaterial) {
    if (!window.confirm(`Delete “${item.title}”?`)) return
    await removeMaterial(item.id)
  }

  const title =
    view.mode === 'module' && activeModule
      ? activeModule.code || activeModule.title
      : 'Academics'
  const subtitle =
    view.mode === 'module' && activeModule
      ? [activeModule.title, activeModule.term].filter(Boolean).join(' · ')
      : 'Your study desk'

  return (
    <div className="screen screen--academics">
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        onBack={() => {
          if (view.mode === 'module') {
            setView({ mode: 'home' })
            resetMaterialForm()
            return
          }
          onBack()
        }}
        action={
          view.mode === 'home' ? (
            <button
              type="button"
              className="acad-icon-btn"
              onClick={() => {
                setError('')
                setShowModuleForm(true)
              }}
              aria-label="Add module"
            >
              +
            </button>
          ) : activeModule ? (
            <button
              type="button"
              className="acad-icon-btn"
              onClick={() => {
                setError('')
                setShowMaterialForm(true)
              }}
              aria-label="Add material"
            >
              +
            </button>
          ) : null
        }
      />

      <ScrollRegion className="screen__scroll acad-scroll">
        {error ? (
          <p className="acad-error" role="alert">
            {error}
          </p>
        ) : null}

        {view.mode === 'home' ? (
          <>
            <div className="acad-owner" role="tablist" aria-label="Whose courses">
              {(['you', 'partner'] as Carer[]).map((who) => (
                <button
                  key={who}
                  type="button"
                  role="tab"
                  aria-selected={owner === who}
                  className={`acad-owner__tab${owner === who ? ' is-active' : ''}`}
                  onClick={() => setOwner(who)}
                >
                  {who === 'you' ? names.you : names.partner}
                </button>
              ))}
            </div>

            {!ready ? (
              <p className="acad-empty">Loading your desk…</p>
            ) : (
              <>
                {upcoming.length > 0 ? (
                  <section className="acad-section" aria-label="Upcoming">
                    <header className="acad-section__head">
                      <h2>Upcoming</h2>
                    </header>
                    <ul className="acad-upcoming">
                      {upcoming.map((item) => {
                        const module = modules.find((row) => row.id === item.moduleId)
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              className={`acad-upcoming__row ${dueTone(item.dueDate, item.done)}`}
                              onClick={() => setView({ mode: 'module', moduleId: item.moduleId })}
                            >
                              <span className="acad-upcoming__meta">
                                <strong>{item.title}</strong>
                                <small>
                                  {[module?.code, kindLabel(item.kind)].filter(Boolean).join(' · ')}
                                </small>
                              </span>
                              <span className="acad-upcoming__due">{formatDue(item.dueDate)}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ) : null}

                <section className="acad-section" aria-label="Modules">
                  <header className="acad-section__head">
                    <h2>Modules</h2>
                    <span>{ownedModules.length}</span>
                  </header>

                  {ownedModules.length === 0 ? (
                    <div className="acad-empty-card">
                      <h3>No modules yet</h3>
                      <p>
                        Add {owner === 'you' ? 'your' : `${names.partner}'s`} courses to keep
                        lectures, tutorials, and assignments in one quiet place.
                      </p>
                      <button
                        type="button"
                        className="btn btn--primary acad-btn"
                        onClick={() => setShowModuleForm(true)}
                      >
                        Add a module
                      </button>
                    </div>
                  ) : (
                    <ul className="acad-modules">
                      {ownedModules.map((module) => {
                        const count = materials.filter((item) => item.moduleId === module.id).length
                        return (
                          <li key={module.id}>
                            <button
                              type="button"
                              className="acad-module"
                              onClick={() => setView({ mode: 'module', moduleId: module.id })}
                            >
                              <span className="acad-module__code">{module.code || '—'}</span>
                              <span className="acad-module__copy">
                                <strong>{module.title}</strong>
                                <small>
                                  {[module.term, `${count} item${count === 1 ? '' : 's'}`]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </small>
                              </span>
                              <span className="acad-module__chev" aria-hidden>
                                ›
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>
              </>
            )}
          </>
        ) : activeModule ? (
          <div className="acad-module-view">
            <div className="acad-module-view__toolbar">
              <p className="acad-module-view__owner">
                {activeModule.owner === 'you' ? names.you : names.partner}
              </p>
              <button
                type="button"
                className="acad-text-btn is-danger"
                onClick={() => void handleDeleteModule(activeModule)}
                disabled={busy}
              >
                Delete module
              </button>
            </div>

            {KINDS.map((group) => {
              const rows = moduleMaterials.filter((item) => item.kind === group.id)
              return (
                <section key={group.id} className="acad-section">
                  <header className="acad-section__head">
                    <h2>{group.label}</h2>
                    <span>{rows.length}</span>
                  </header>
                  {rows.length === 0 ? (
                    <p className="acad-empty-inline">Nothing here yet</p>
                  ) : (
                    <ul className="acad-materials">
                      {rows.map((item) => (
                        <li key={item.id} className={`acad-material${item.done ? ' is-done' : ''}`}>
                          <button
                            type="button"
                            className="acad-material__check"
                            onClick={() => void toggleMaterialDone(item.id)}
                            aria-label={item.done ? 'Mark as not done' : 'Mark as done'}
                            disabled={busy}
                          >
                            {item.done ? '✓' : ''}
                          </button>
                          <div className="acad-material__body">
                            <strong>{item.title}</strong>
                            <small>
                              {[
                                item.dueDate ? `Due ${formatDue(item.dueDate)}` : '',
                                item.fileName,
                                item.notes,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </small>
                            {item.fileUrl ? (
                              <a
                                className="acad-material__file"
                                href={item.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open file
                              </a>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className="acad-text-btn is-danger"
                            onClick={() => void handleDeleteMaterial(item)}
                            disabled={busy}
                          >
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
        ) : (
          <p className="acad-empty">Module not found.</p>
        )}
      </ScrollRegion>

      {showModuleForm ? (
        <div className="acad-sheet" role="dialog" aria-modal="true" aria-label="Add module">
          <div className="acad-sheet__panel">
            <header className="acad-sheet__head">
              <h2>New module</h2>
              <button type="button" className="acad-text-btn" onClick={resetModuleForm}>
                Close
              </button>
            </header>
            <label className="field">
              <span>Code</span>
              <input
                value={moduleCode}
                onChange={(event) => setModuleCode(event.target.value)}
                placeholder="CS101"
                maxLength={24}
              />
            </label>
            <label className="field">
              <span>Title</span>
              <input
                value={moduleTitle}
                onChange={(event) => setModuleTitle(event.target.value)}
                placeholder="Introduction to Computing"
                maxLength={80}
              />
            </label>
            <label className="field">
              <span>Term (optional)</span>
              <input
                value={moduleTerm}
                onChange={(event) => setModuleTerm(event.target.value)}
                placeholder="Sem 1 · 2026"
                maxLength={40}
              />
            </label>
            <button
              type="button"
              className="btn btn--primary acad-btn"
              onClick={() => void submitModule()}
              disabled={busy || !moduleTitle.trim()}
            >
              {busy ? 'Saving…' : 'Save module'}
            </button>
          </div>
        </div>
      ) : null}

      {showMaterialForm && activeModule ? (
        <div className="acad-sheet" role="dialog" aria-modal="true" aria-label="Add material">
          <div className="acad-sheet__panel">
            <header className="acad-sheet__head">
              <h2>Add material</h2>
              <button type="button" className="acad-text-btn" onClick={resetMaterialForm}>
                Close
              </button>
            </header>
            <label className="field">
              <span>Type</span>
              <select
                value={materialKind}
                onChange={(event) => setMaterialKind(event.target.value as AcademicMaterialKind)}
              >
                {KINDS.map((kind) => (
                  <option key={kind.id} value={kind.id}>
                    {kind.label.slice(0, -1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Title</span>
              <input
                value={materialTitle}
                onChange={(event) => setMaterialTitle(event.target.value)}
                placeholder="Week 3 slides"
                maxLength={100}
              />
            </label>
            <label className="field field--date">
              <span>Due date (optional)</span>
              <input
                type="date"
                value={materialDue}
                onChange={(event) => setMaterialDue(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Notes (optional)</span>
              <textarea
                value={materialNotes}
                onChange={(event) => setMaterialNotes(event.target.value)}
                placeholder="Chapter focus, tips, links…"
                rows={3}
                maxLength={400}
              />
            </label>
            <label className="field">
              <span>File (optional)</span>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt"
                onChange={(event) => setMaterialFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <button
              type="button"
              className="btn btn--primary acad-btn"
              onClick={() => void submitMaterial()}
              disabled={busy || !materialTitle.trim()}
            >
              {busy ? 'Saving…' : 'Save material'}
            </button>
          </div>
        </div>
      ) : null}

      <StudyBuddy
        open={buddyOpen}
        onOpen={() => setBuddyOpen(true)}
        onClose={() => setBuddyOpen(false)}
        modules={modules}
        materials={materials}
        names={names}
        isCloud={isCloud}
        defaultOwner={owner}
      />
    </div>
  )
}
