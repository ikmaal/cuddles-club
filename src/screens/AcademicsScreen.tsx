import { useMemo, useRef, useState } from 'react'
import { ScreenHeader } from '../components/ScreenHeader'
import { ScrollRegion } from '../components/ScrollRegion'
import type { useAcademics } from '../hooks/useAcademics'
import type { AcademicMaterial, AcademicMaterialKind, Carer } from '../types'

type AcademicsApi = ReturnType<typeof useAcademics>

interface AcademicsScreenProps extends AcademicsApi {
  onBack: () => void
}

type View = { mode: 'home' } | { mode: 'module'; moduleId: string }

function isDeskKind(kind: AcademicMaterialKind) {
  return kind === 'lecture' || kind === 'assignment'
}

function sortLectures(rows: AcademicMaterial[]) {
  return [...rows].sort((a, b) => a.createdAt - b.createdAt || a.title.localeCompare(b.title))
}

function sortAssignments(rows: AcademicMaterial[]) {
  return [...rows].sort((a, b) => {
    if (a.done !== b.done) return Number(a.done) - Number(b.done)
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate)
    }
    if (a.dueDate !== b.dueDate) return a.dueDate ? -1 : 1
    return b.createdAt - a.createdAt
  })
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
  onBack,
  setError,
  addModule,
  addMaterial,
  toggleMaterialDone,
  removeMaterial,
}: AcademicsScreenProps) {
  const [owner, setOwner] = useState<Carer>('you')
  const [view, setView] = useState<View>({ mode: 'home' })
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
    return materials.filter((item) => item.moduleId === activeModule.id && isDeskKind(item.kind))
  }, [activeModule, materials])

  const lectures = useMemo(
    () => sortLectures(moduleMaterials.filter((item) => item.kind === 'lecture')),
    [moduleMaterials],
  )
  const assignments = useMemo(
    () => sortAssignments(moduleMaterials.filter((item) => item.kind === 'assignment')),
    [moduleMaterials],
  )

  const upcoming = useMemo(() => {
    const moduleIds = new Set(ownedModules.map((item) => item.id))
    return materials
      .filter(
        (item) =>
          moduleIds.has(item.moduleId) &&
          item.kind === 'assignment' &&
          item.dueDate &&
          !item.done,
      )
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

  function openMaterialForm(kind: AcademicMaterialKind = 'lecture') {
    setError('')
    setMaterialKind(kind)
    setShowMaterialForm(true)
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
      dueDate: materialKind === 'assignment' ? materialDue : '',
      notes: materialKind === 'assignment' ? materialNotes : '',
      file: materialFile,
    })
    if (created) resetMaterialForm()
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
              onClick={() => openMaterialForm('lecture')}
              aria-label="Add lecture"
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
                                <small>{[module?.code, module?.title].filter(Boolean).join(' · ')}</small>
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
                        lectures and assignments in one quiet place.
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
                        const count = materials.filter(
                          (item) => item.moduleId === module.id && isDeskKind(item.kind),
                        ).length
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
            <p className="acad-module-view__owner">
              {activeModule.owner === 'you' ? names.you : names.partner}
            </p>

            <section className="acad-section" aria-label="Lectures">
              <header className="acad-section__head">
                <h2>Lectures</h2>
                <span>{lectures.length}</span>
              </header>
              <ul className="acad-lectures">
                {lectures.map((item, index) => (
                  <li key={item.id} className="acad-lecture">
                    {item.fileUrl ? (
                      <a
                        className="acad-lecture__card"
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${item.title}`}
                      >
                        <span className="acad-lecture__index">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <strong>{item.title}</strong>
                        <small>{item.fileName || 'Lecture file'}</small>
                      </a>
                    ) : (
                      <div className="acad-lecture__card is-empty">
                        <span className="acad-lecture__index">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <strong>{item.title}</strong>
                        <small>No file yet</small>
                      </div>
                    )}
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    className="acad-lecture-add"
                    onClick={() => openMaterialForm('lecture')}
                  >
                    <span aria-hidden>+</span>
                    Add lecture
                  </button>
                </li>
              </ul>
            </section>

            <section className="acad-section" aria-label="Assignments">
              <header className="acad-section__head">
                <h2>Assignments</h2>
                <button
                  type="button"
                  className="acad-text-btn"
                  onClick={() => openMaterialForm('assignment')}
                >
                  Add
                </button>
              </header>
              {assignments.length === 0 ? (
                <button
                  type="button"
                  className="acad-assign-empty"
                  onClick={() => openMaterialForm('assignment')}
                >
                  <strong>No assignments yet</strong>
                  <span>Add a due date and keep track of what’s next.</span>
                </button>
              ) : (
                <ul className="acad-assignments">
                  {assignments.map((item) => (
                    <li
                      key={item.id}
                      className={`acad-assignment${item.done ? ' is-done' : ''} ${dueTone(item.dueDate, item.done)}`}
                    >
                      <button
                        type="button"
                        className="acad-material__check"
                        onClick={() => void toggleMaterialDone(item.id)}
                        aria-label={item.done ? 'Mark as not done' : 'Mark as done'}
                        disabled={busy}
                      >
                        {item.done ? '✓' : ''}
                      </button>
                      <div className="acad-assignment__body">
                        <strong>{item.title}</strong>
                        <small>
                          {[item.fileName, item.notes].filter(Boolean).join(' · ') || 'No file yet'}
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
                      <div className="acad-assignment__side">
                        {item.dueDate ? (
                          <span className="acad-assignment__due">{formatDue(item.dueDate)}</span>
                        ) : (
                          <span className="acad-assignment__due is-none">No due</span>
                        )}
                        <button
                          type="button"
                          className="acad-text-btn is-danger"
                          onClick={() => void handleDeleteMaterial(item)}
                          disabled={busy}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
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
        <div
          className="acad-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={materialKind === 'assignment' ? 'Add assignment' : 'Add lecture'}
        >
          <div className="acad-sheet__panel">
            <header className="acad-sheet__head">
              <h2>{materialKind === 'assignment' ? 'New assignment' : 'New lecture'}</h2>
              <button type="button" className="acad-text-btn" onClick={resetMaterialForm}>
                Close
              </button>
            </header>
            <label className="field">
              <span>Title</span>
              <input
                value={materialTitle}
                onChange={(event) => setMaterialTitle(event.target.value)}
                placeholder={
                  materialKind === 'assignment' ? 'Problem set 2' : 'Week 3 slides'
                }
                maxLength={100}
              />
            </label>
            {materialKind === 'assignment' ? (
              <>
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
                    placeholder="Weighting, submission notes…"
                    rows={3}
                    maxLength={400}
                  />
                </label>
              </>
            ) : null}
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
              {busy
                ? 'Saving…'
                : materialKind === 'assignment'
                  ? 'Save assignment'
                  : 'Save lecture'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
