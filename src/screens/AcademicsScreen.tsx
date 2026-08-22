import { useEffect, useMemo, useRef, useState } from 'react'
import { AcademicFileViewer } from '../components/AcademicFileViewer'
import { buddyAvatarSrc, cardMemberSlot } from '../components/CardBuddy'
import {
  BookIcon,
  CalendarIcon,
  CapIcon,
  CodeBracketsIcon,
  DocPageIcon,
  MegaphoneIcon,
} from '../components/Icons'
import { ScreenHeader } from '../components/ScreenHeader'
import { ScrollRegion } from '../components/ScrollRegion'
import { useCouple } from '../context/CoupleContext'
import { useLongPress } from '../hooks/useLongPress'
import { academicFileLabel } from '../lib/academicFileKind'
import type { useAcademics } from '../hooks/useAcademics'
import type { AcademicMaterial, AcademicMaterialKind, AcademicModule, Carer } from '../types'

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

const DEADLINE_PREVIEW = 4
const ACAD_THEMES = ['lilac', 'rose', 'mint'] as const
type AcadTheme = (typeof ACAD_THEMES)[number]
type AcadGlyph = 'doc' | 'megaphone' | 'cap' | 'code' | 'book'

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name
}

function themeFromId(id: string): AcadTheme {
  let sum = 0
  for (const char of id) sum += char.charCodeAt(0)
  return ACAD_THEMES[sum % ACAD_THEMES.length]
}

function glyphForDeadline(title: string, theme: AcadTheme): AcadGlyph {
  const text = title.toLowerCase()
  if (/\btma\b|present|pitch|market/.test(text)) return 'megaphone'
  if (/\bgba\b|capstone|project/.test(text)) return 'cap'
  if (/\bpct\b|python|code|program|data|anl/.test(text)) return 'code'
  if (theme === 'rose') return 'megaphone'
  if (theme === 'mint') return 'cap'
  return 'doc'
}

function glyphForModule(title: string, code: string, theme: AcadTheme): AcadGlyph {
  const text = `${code} ${title}`.toLowerCase()
  if (/market|mkt|present/.test(text)) return 'megaphone'
  if (/python|code|data|anl|program/.test(text)) return 'code'
  if (/learn|nco|edu/.test(text)) return 'book'
  if (theme === 'rose') return 'megaphone'
  if (theme === 'mint') return 'code'
  return 'book'
}

function AcadGlyphIcon({ name, size = 18 }: { name: AcadGlyph; size?: number }) {
  if (name === 'megaphone') return <MegaphoneIcon size={size} />
  if (name === 'cap') return <CapIcon size={size} />
  if (name === 'code') return <CodeBracketsIcon size={size} />
  if (name === 'book') return <BookIcon size={size} />
  return <DocPageIcon size={size} />
}

function formatDueCard(dueDate: string): { date: string; weekday: string } {
  const date = new Date(`${dueDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return { date: dueDate || '—', weekday: '' }
  return {
    date: date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
  }
}

function DeadlineCard({
  item,
  module,
  clickable,
  onOpen,
}: {
  item: AcademicMaterial
  module?: AcademicModule
  clickable?: boolean
  onOpen?: () => void
}) {
  const theme = themeFromId(module?.id || item.moduleId)
  const due = formatDueCard(item.dueDate)
  const className = `acad-upcoming__row acad-theme-${theme} ${dueTone(item.dueDate, item.done)}`
  const body = (
    <>
      <span className="acad-upcoming__icon">
        <AcadGlyphIcon name={glyphForDeadline(item.title, theme)} />
      </span>
      <span className="acad-upcoming__meta">
        <strong>{item.title}</strong>
        <small>{[module?.code, module?.title].filter(Boolean).join(' · ')}</small>
      </span>
      <span className="acad-upcoming__due">
        <i aria-hidden />
        <b>{due.date}</b>
        <small>{due.weekday}</small>
      </span>
    </>
  )

  if (clickable) {
    return (
      <button type="button" className={className} onClick={onOpen}>
        {body}
      </button>
    )
  }

  return <div className={className}>{body}</div>
}

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
  const { slot } = useCouple()
  const [owner, setOwner] = useState<Carer>('you')
  const [view, setView] = useState<View>({ mode: 'home' })
  const [showAllDeadlines, setShowAllDeadlines] = useState(false)
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

  const visibleUpcoming = showAllDeadlines
    ? upcoming
    : upcoming.slice(0, DEADLINE_PREVIEW)

  const title =
    view.mode === 'module' && activeModule
      ? activeModule.code || activeModule.title
      : 'Academics'
  const subtitle =
    view.mode === 'module' && activeModule
      ? [activeModule.title, activeModule.term].filter(Boolean).join(' · ')
      : undefined

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
                  onClick={() => {
                    setOwner(who)
                    setShowAllDeadlines(false)
                  }}
                >
                  <img
                    className="acad-owner__avatar"
                    src={buddyAvatarSrc(cardMemberSlot(who, slot))}
                    alt=""
                    width={28}
                    height={28}
                  />
                  <span>{firstName(who === 'you' ? names.you : names.partner)}</span>
                </button>
              ))}
            </div>

            {!ready ? (
              <p className="acad-empty">Loading your desk…</p>
            ) : (
              <>
                {upcoming.length > 0 ? (
                  <section className="acad-section" aria-label="Upcoming Deadlines">
                    <header className="acad-section__head">
                      <h2>
                        <CalendarIcon size={18} />
                        Upcoming Deadlines
                      </h2>
                      {upcoming.length > DEADLINE_PREVIEW ? (
                        <button
                          type="button"
                          className="acad-section__link"
                          onClick={() => setShowAllDeadlines((open) => !open)}
                        >
                          {showAllDeadlines ? 'Show less' : 'See all'}
                        </button>
                      ) : null}
                    </header>
                    <ul className="acad-upcoming">
                      {visibleUpcoming.map((item) => {
                        const module = modules.find((row) => row.id === item.moduleId)
                        return (
                          <li key={item.id}>
                            <DeadlineCard
                              item={item}
                              module={module}
                              clickable
                              onOpen={() => setView({ mode: 'module', moduleId: item.moduleId })}
                            />
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ) : null}

                <section className="acad-section" aria-label="Your Modules">
                  <header className="acad-section__head">
                    <h2>
                      <CapIcon size={18} />
                      Your Modules
                    </h2>
                    <span>
                      {ownedModules.length} {ownedModules.length === 1 ? 'module' : 'modules'}
                    </span>
                  </header>

                  {ownedModules.length === 0 ? (
                    <div className="acad-empty-card">
                      <h3>No modules yet</h3>
                      <p>
                        Add {owner === 'you' ? 'your' : `${firstName(names.partner)}'s`} courses to
                        keep lectures and assignments in one place.
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
                        const theme = themeFromId(module.id)
                        return (
                          <li key={module.id}>
                            <button
                              type="button"
                              className={`acad-module acad-theme-${theme}`}
                              onClick={() => setView({ mode: 'module', moduleId: module.id })}
                            >
                              <span className="acad-module__icon">
                                <AcadGlyphIcon
                                  name={glyphForModule(module.title, module.code, theme)}
                                />
                              </span>
                              <span className="acad-module__code">{module.code || 'Module'}</span>
                              <strong>{module.title}</strong>
                              <small>
                                {count} {count === 1 ? 'item' : 'items'}
                              </small>
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
                  <h2>
                    <CalendarIcon size={18} />
                    Upcoming Deadlines
                  </h2>
                  <span>{deadlines.length} open</span>
                </header>
                <ul className="acad-upcoming">
                  {deadlines.map((item) => (
                    <li key={item.id}>
                      <DeadlineCard item={item} module={activeModule} />
                    </li>
                  ))}
                </ul>
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
