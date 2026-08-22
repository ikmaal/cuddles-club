import { useEffect, useMemo, useRef, useState } from 'react'
import { AcademicFileViewer } from '../components/AcademicFileViewer'
import { ScreenHeader } from '../components/ScreenHeader'
import { ScrollRegion } from '../components/ScrollRegion'
import { useLongPress } from '../hooks/useLongPress'
import { academicFileLabel } from '../lib/academicFileKind'
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

function sortDeskFiles(rows: AcademicMaterial[]) {
  return [...rows].sort((a, b) => a.createdAt - b.createdAt || a.title.localeCompare(b.title))
}

function formatDue(dueDate: string) {
  if (!dueDate) return ''
  const date = new Date(`${dueDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return dueDate
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function daysUntil(dueDate: string): number | null {
  if (!dueDate) return null
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const due = new Date(`${dueDate}T12:00:00`)
  if (Number.isNaN(due.getTime())) return null
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}

function dueTone(dueDate: string, done: boolean) {
  const diff = daysUntil(dueDate)
  if (diff === null || done) return ''
  if (diff < 0) return 'is-overdue'
  if (diff <= 3) return 'is-soon'
  return ''
}

function dueRelative(dueDate: string): string {
  const diff = daysUntil(dueDate)
  if (diff === null) return ''
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  if (diff === -1) return 'Due yesterday'
  if (diff < 0) return `${-diff} days late`
  if (diff <= 14) return `Due in ${diff} days`
  return `Due ${formatDue(dueDate)}`
}

function dueGroup(dueDate: string): 'overdue' | 'soon' | 'later' | null {
  const diff = daysUntil(dueDate)
  if (diff === null) return null
  if (diff < 0) return 'overdue'
  if (diff <= 3) return 'soon'
  return 'later'
}

function formatDueParts(dueDate: string): { day: string; month: string } {
  const date = new Date(`${dueDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return { day: '—', month: '' }
  return {
    day: date.toLocaleDateString(undefined, { day: '2-digit' }),
    month: date.toLocaleDateString(undefined, { month: 'short' }),
  }
}

const DEADLINE_GROUPS: { id: 'overdue' | 'soon' | 'later'; label: string }[] = [
  { id: 'overdue', label: 'Late' },
  { id: 'soon', label: 'Due soon' },
  { id: 'later', label: 'Later' },
]

function fileCaption(fileName: string) {
  if (!fileName.trim()) return 'No file'
  const label = academicFileLabel(fileName)
  return label === 'JPEG' ? 'JPG' : label
}

function MaterialTile({
  item,
  onOpen,
  onMenu,
}: {
  item: AcademicMaterial
  onOpen: (item: AcademicMaterial) => void
  onMenu: (item: AcademicMaterial) => void
}) {
  const { holding, bind } = useLongPress(
    () => {
      if (item.fileUrl) onOpen(item)
    },
    () => onMenu(item),
  )

  return (
    <li className="acad-tile">
      <button
        type="button"
        className={`acad-tile__card${item.fileUrl ? '' : ' is-empty'}${holding ? ' is-holding' : ''}`}
        aria-label={item.fileUrl ? `Open ${item.title}. Hold for options.` : `${item.title}. Hold for options.`}
        {...bind}
      >
        <strong>{item.title}</strong>
        <small>{fileCaption(item.fileName)}</small>
      </button>
    </li>
  )
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
  updateMaterial,
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [menuItem, setMenuItem] = useState<AcademicMaterial | null>(null)
  const [menuPhase, setMenuPhase] = useState<'menu' | 'delete'>('menu')
  const [menuReady, setMenuReady] = useState(false)
  const [viewerId, setViewerId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const replaceRef = useRef<HTMLInputElement>(null)
  const replaceIdRef = useRef<string | null>(null)

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
    () => sortDeskFiles(moduleMaterials.filter((item) => item.kind === 'lecture')),
    [moduleMaterials],
  )
  const assignments = useMemo(
    () => sortDeskFiles(moduleMaterials.filter((item) => item.kind === 'assignment')),
    [moduleMaterials],
  )
  const deadlines = useMemo(() => {
    return assignments
      .filter((item) => item.dueDate && !item.done)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }, [assignments])

  const viewing = useMemo(
    () => (viewerId ? materials.find((item) => item.id === viewerId) ?? null : null),
    [materials, viewerId],
  )
  const menuTarget = useMemo(
    () => (menuItem ? materials.find((item) => item.id === menuItem.id) ?? menuItem : null),
    [materials, menuItem],
  )

  useEffect(() => {
    if (!menuItem) {
      setMenuReady(false)
      setMenuPhase('menu')
      return
    }
    setMenuReady(false)
    setMenuPhase('menu')
    const timer = window.setTimeout(() => setMenuReady(true), 280)
    return () => window.clearTimeout(timer)
  }, [menuItem])

  useEffect(() => {
    if (!menuItem) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuItem(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuItem])

  useEffect(() => {
    if (!viewerId) return
    if (!materials.some((item) => item.id === viewerId)) setViewerId(null)
  }, [materials, viewerId])

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
    setEditingId(null)
    if (fileRef.current) fileRef.current.value = ''
    setShowMaterialForm(false)
  }

  function openMaterialForm(kind: AcademicMaterialKind = 'lecture') {
    setError('')
    setEditingId(null)
    setMaterialKind(kind)
    setMaterialTitle('')
    setMaterialDue('')
    setMaterialNotes('')
    setMaterialFile(null)
    setShowMaterialForm(true)
  }

  function openMenu(item: AcademicMaterial) {
    setError('')
    setMenuItem(item)
  }

  function openViewer(item: AcademicMaterial) {
    if (!item.fileUrl) return
    setViewerId(item.id)
  }

  function openEdit(item: AcademicMaterial) {
    setError('')
    setMenuItem(null)
    setEditingId(item.id)
    setMaterialKind(item.kind)
    setMaterialTitle(item.title)
    setMaterialDue(item.dueDate)
    setMaterialNotes(item.notes)
    setMaterialFile(null)
    if (fileRef.current) fileRef.current.value = ''
    setShowMaterialForm(true)
  }

  function openReplace(item: AcademicMaterial) {
    replaceIdRef.current = item.id
    setMenuItem(null)
    replaceRef.current?.click()
  }

  async function handleReplaceFile(file: File | null) {
    const id = replaceIdRef.current
    replaceIdRef.current = null
    if (replaceRef.current) replaceRef.current.value = ''
    if (!id || !file) return
    setError('')
    await updateMaterial(id, { file })
  }

  async function handleDeleteMenuItem() {
    if (!menuTarget) return
    const id = menuTarget.id
    setMenuItem(null)
    if (viewerId === id) setViewerId(null)
    await removeMaterial(id)
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
    if (editingId) {
      const updated = await updateMaterial(editingId, {
        title: materialTitle,
        dueDate: materialKind === 'assignment' ? materialDue : '',
        notes: materialKind === 'assignment' ? materialNotes : '',
      })
      if (updated) resetMaterialForm()
      return
    }
    const created = await addMaterial(activeModule.id, {
      kind: materialKind,
      title: materialTitle,
      dueDate: materialKind === 'assignment' ? materialDue : '',
      notes: materialKind === 'assignment' ? materialNotes : '',
      file: materialFile,
    })
    if (created) resetMaterialForm()
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
          if (viewerId) {
            setViewerId(null)
            return
          }
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

            {deadlines.length > 0 ? (
              <section className="acad-section" aria-label="Deadlines">
                <header className="acad-section__head">
                  <h2>Deadlines</h2>
                  <span>{deadlines.length} open</span>
                </header>
                <div className="acad-deadlines">
                  {DEADLINE_GROUPS.map((group) => {
                    const rows = deadlines.filter((item) => dueGroup(item.dueDate) === group.id)
                    if (!rows.length) return null
                    return (
                      <div key={group.id} className="acad-deadline-group">
                        <h3>{group.label}</h3>
                        <ul>
                          {rows.map((item) => {
                            const parts = formatDueParts(item.dueDate)
                            return (
                              <li
                                key={item.id}
                                className={`acad-deadline ${dueTone(item.dueDate, item.done)}`}
                              >
                                <time className="acad-deadline__date" dateTime={item.dueDate}>
                                  <span>{parts.day}</span>
                                  <span>{parts.month}</span>
                                </time>
                                <div className="acad-deadline__copy">
                                  <strong>{item.title}</strong>
                                  <small>{dueRelative(item.dueDate)}</small>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              </section>
            ) : null}

            <section className="acad-section" aria-label="Lectures">
              <header className="acad-section__head">
                <h2>Lectures</h2>
                <span>{lectures.length}</span>
              </header>
              <ul className="acad-tiles">
                {lectures.map((item) => (
                  <MaterialTile
                    key={item.id}
                    item={item}
                    onOpen={openViewer}
                    onMenu={openMenu}
                  />
                ))}
                <li>
                  <button
                    type="button"
                    className="acad-tile-add"
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
                <span>{assignments.length}</span>
              </header>
              <ul className="acad-tiles">
                {assignments.map((item) => (
                  <MaterialTile
                    key={item.id}
                    item={item}
                    onOpen={openViewer}
                    onMenu={openMenu}
                  />
                ))}
                <li>
                  <button
                    type="button"
                    className="acad-tile-add"
                    onClick={() => openMaterialForm('assignment')}
                  >
                    <span aria-hidden>+</span>
                    Add assignment
                  </button>
                </li>
              </ul>
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
          aria-label={
            editingId
              ? materialKind === 'assignment'
                ? 'Edit assignment'
                : 'Edit lecture'
              : materialKind === 'assignment'
                ? 'Add assignment'
                : 'Add lecture'
          }
        >
          <div className="acad-sheet__panel">
            <header className="acad-sheet__head">
              <h2>
                {editingId
                  ? materialKind === 'assignment'
                    ? 'Edit assignment'
                    : 'Edit lecture'
                  : materialKind === 'assignment'
                    ? 'New assignment'
                    : 'New lecture'}
              </h2>
              <button type="button" className="acad-text-btn" onClick={resetMaterialForm}>
                Close
              </button>
            </header>
            {error ? (
              <p className="acad-error" role="alert">
                {error}
              </p>
            ) : null}
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
            {editingId ? null : (
              <label className="field">
                <span>File (optional)</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt"
                  onChange={(event) => setMaterialFile(event.target.files?.[0] ?? null)}
                />
              </label>
            )}
            <button
              type="button"
              className="btn btn--primary acad-btn"
              onClick={() => void submitMaterial()}
              disabled={busy || !materialTitle.trim()}
            >
              {busy
                ? 'Saving…'
                : editingId
                  ? 'Save changes'
                  : materialKind === 'assignment'
                    ? 'Save assignment'
                    : 'Save lecture'}
            </button>
          </div>
        </div>
      ) : null}

      <input
        ref={replaceRef}
        className="sr-only"
        type="file"
        accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt"
        aria-hidden
        tabIndex={-1}
        onChange={(event) => void handleReplaceFile(event.target.files?.[0] ?? null)}
      />

      {menuTarget ? (
        <div
          className="acad-action"
          role="dialog"
          aria-modal="true"
          aria-label={menuPhase === 'delete' ? 'Delete file' : 'File options'}
          onClick={() => {
            if (menuReady) setMenuItem(null)
          }}
        >
          <div
            className="acad-action__panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="acad-action__handle" aria-hidden />
            {menuPhase === 'delete' ? (
              <>
                <div className="acad-action__meta">
                  <strong>Delete this {menuTarget.kind}?</strong>
                  <small>{menuTarget.title}</small>
                </div>
                <div className="acad-action__list">
                  <button
                    type="button"
                    className="acad-action__row is-danger"
                    disabled={!menuReady || busy}
                    onClick={() => void handleDeleteMenuItem()}
                  >
                    Delete
                  </button>
                </div>
                <button
                  type="button"
                  className="acad-action__cancel"
                  onClick={() => setMenuPhase('menu')}
                >
                  Keep it
                </button>
              </>
            ) : (
              <>
                <div className="acad-action__meta">
                  <strong>{menuTarget.title}</strong>
                  <small>{menuTarget.fileName || 'No file yet'}</small>
                </div>
                <div className="acad-action__list">
                  <button
                    type="button"
                    className="acad-action__row"
                    disabled={!menuReady}
                    onClick={() => openEdit(menuTarget)}
                  >
                    Edit details
                  </button>
                  <button
                    type="button"
                    className="acad-action__row"
                    disabled={!menuReady || busy}
                    onClick={() => openReplace(menuTarget)}
                  >
                    {menuTarget.fileName ? 'Replace file' : 'Add file'}
                  </button>
                  <button
                    type="button"
                    className="acad-action__row is-danger"
                    disabled={!menuReady}
                    onClick={() => setMenuPhase('delete')}
                  >
                    Delete
                  </button>
                </div>
                <button
                  type="button"
                  className="acad-action__cancel"
                  onClick={() => setMenuItem(null)}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {viewing?.fileUrl ? <AcademicFileViewer item={viewing} onClose={() => setViewerId(null)} /> : null}
    </div>
  )
}
