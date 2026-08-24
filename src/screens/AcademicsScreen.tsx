import { useEffect, useMemo, useRef, useState } from 'react'
import { AcademicFileViewer } from '../components/AcademicFileViewer'
import {
  BackIcon,
  BookIcon,
  CalcIcon,
  CalendarIcon,
  CapIcon,
  ChevronIcon,
  DocPageIcon,
  DotsIcon,
  LaptopIcon,
  MegaphoneIcon,
  PencilIcon,
  PlusIcon,
  SwapIcon,
} from '../components/Icons'
import { ScrollRegion } from '../components/ScrollRegion'
import { StudyTogetherBanner } from '../components/StudyTogetherBanner'
import { useLongPress } from '../hooks/useLongPress'
import { academicFileLabel } from '../lib/academicFileKind'
import type { useAcademics } from '../hooks/useAcademics'
import {
  DEFAULT_MODULE_COLOR,
  MODULE_COLORS,
  parseModuleColor,
  type AcademicMaterial,
  type AcademicMaterialKind,
  type AcademicModule,
  type Carer,
  type ModuleColor,
} from '../types'

type AcademicsApi = ReturnType<typeof useAcademics>

interface AcademicsScreenProps extends AcademicsApi {
  onBack: () => void
}

type View = { mode: 'home' } | { mode: 'module'; moduleId: string }

function isDeskKind(kind: AcademicMaterialKind) {
  return kind === 'lecture' || kind === 'assignment' || kind === 'notes'
}

function kindLabel(kind: AcademicMaterialKind) {
  if (kind === 'assignment') return 'assignment'
  if (kind === 'notes') return 'notes'
  return 'lecture'
}

function sortDeskFiles(rows: AcademicMaterial[]) {
  return [...rows].sort((a, b) => a.createdAt - b.createdAt || a.title.localeCompare(b.title))
}

function parseDueDate(dueDate: string): Date | null {
  if (!dueDate) return null
  const due = new Date(`${dueDate}T12:00:00`)
  return Number.isNaN(due.getTime()) ? null : due
}

function daysUntil(dueDate: string): number | null {
  const due = parseDueDate(dueDate)
  if (!due) return null
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}

function formatDueDate(dueDate: string): string {
  const due = parseDueDate(dueDate)
  if (!due) return ''
  const sameYear = due.getFullYear() === new Date().getFullYear()
  return due.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

function dueTone(dueDate: string, done: boolean) {
  const diff = daysUntil(dueDate)
  if (diff === null || done) return ''
  if (diff < 0) return 'is-overdue'
  if (diff <= 3) return 'is-soon'
  return ''
}

const DEADLINE_PREVIEW = 4
type AcadGlyph = 'doc' | 'megaphone' | 'cap' | 'code' | 'book' | 'calc' | 'laptop'

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name
}

function ownedLabel(name: string) {
  const first = firstName(name)
  return /s$/i.test(first) ? `${first}'` : `${first}'s`
}

function dueLine(dueDate: string, done: boolean) {
  const date = formatDueDate(dueDate)
  const withDate = (relative: string) => (date ? `${date} · ${relative}` : relative)
  if (done) return { text: withDate('Completed'), tone: 'calm', fire: false }
  const diff = daysUntil(dueDate)
  if (diff === null) return { text: '', tone: 'calm', fire: false }
  if (diff < 0) return { text: withDate('Overdue'), tone: 'late', fire: true }
  if (diff === 0) return { text: withDate('Due today'), tone: 'hot', fire: true }
  if (diff === 1) return { text: withDate('Due in 1 day'), tone: 'hot', fire: true }
  if (diff <= 2) return { text: withDate(`Due in ${diff} days`), tone: 'hot', fire: true }
  if (diff <= 7) return { text: withDate(`Due in ${diff} days`), tone: 'warm', fire: false }
  return { text: withDate(`Due in ${diff} days`), tone: 'calm', fire: false }
}

function themeFromModule(module?: AcademicModule, id = ''): ModuleColor {
  return parseModuleColor(module?.color, module?.id || id)
}

function glyphForDeadline(title: string, theme: ModuleColor): AcadGlyph {
  const text = title.toLowerCase()
  if (/\btma\b|present|pitch|market/.test(text)) return 'megaphone'
  if (/\bgba\b|capstone|project/.test(text)) return 'cap'
  if (/calc|math|ma1|tutorial|algebra/.test(text)) return 'calc'
  if (/\bpct\b|python|code|program|data|anl|report|business/.test(text)) return 'laptop'
  if (theme === 'rose' || theme === 'peach') return 'megaphone'
  if (theme === 'mint') return 'cap'
  return 'doc'
}

function glyphForModule(title: string, code: string, theme: ModuleColor): AcadGlyph {
  const text = `${code} ${title}`.toLowerCase()
  if (/market|mkt|present/.test(text)) return 'megaphone'
  if (/python|code|data|anl|program|report/.test(text)) return 'laptop'
  if (/calc|math|ma1|algebra/.test(text)) return 'calc'
  if (/learn|nco|edu/.test(text)) return 'book'
  if (theme === 'rose' || theme === 'peach') return 'megaphone'
  if (theme === 'mint') return 'code'
  return 'book'
}

function AcadGlyphIcon({ name, size = 18 }: { name: AcadGlyph; size?: number }) {
  if (name === 'megaphone') return <MegaphoneIcon size={size} />
  if (name === 'cap') return <CapIcon size={size} />
  if (name === 'code' || name === 'laptop') return <LaptopIcon size={size} />
  if (name === 'calc') return <CalcIcon size={size} />
  if (name === 'book') return <BookIcon size={size} />
  return <DocPageIcon size={size} />
}

function DeadlineCard({
  item,
  module,
  clickable,
  onOpen,
  layout = 'home',
}: {
  item: AcademicMaterial
  module?: AcademicModule
  clickable?: boolean
  onOpen?: () => void
  layout?: 'home' | 'page'
}) {
  const theme = themeFromModule(module, item.moduleId)
  const due = dueLine(item.dueDate, item.done)
  const className =
    layout === 'page'
      ? `acad-due ${dueTone(item.dueDate, item.done)}`
      : `acad-upcoming__row acad-theme-${theme} ${dueTone(item.dueDate, item.done)}`
  const body =
    layout === 'page' ? (
      <>
        <span className="acad-due__icon">
          <AcadGlyphIcon name={glyphForDeadline(item.title, theme)} size={22} />
        </span>
        <span className="acad-due__meta">
          <strong>{item.title}</strong>
          {due.text ? (
            <small className={`acad-due__when is-${due.tone}`}>{due.text}</small>
          ) : (
            <small>{[module?.code, module?.title].filter(Boolean).join(' · ')}</small>
          )}
        </span>
        <span className="acad-due__code">{module?.code || 'Module'}</span>
        <ChevronIcon size={16} />
      </>
    ) : (
      <>
        <span className="acad-upcoming__icon">
          <AcadGlyphIcon name={glyphForDeadline(item.title, theme)} size={28} />
        </span>
        <span className="acad-upcoming__meta">
          <strong>{item.title}</strong>
          {due.text ? (
            <small className={`acad-upcoming__when is-${due.tone}`}>
              {due.text}
              {due.fire ? ' 🔥' : ''}
            </small>
          ) : (
            <small>{[module?.code, module?.title].filter(Boolean).join(' · ')}</small>
          )}
        </span>
        <span className="acad-upcoming__code">{module?.code || 'Module'}</span>
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
    <li className="acad-file">
      <button
        type="button"
        className={`acad-file__card${item.fileUrl ? '' : ' is-empty'}${holding ? ' is-holding' : ''}`}
        aria-label={item.fileUrl ? `Open ${item.title}. Hold for options.` : `${item.title}. Hold for options.`}
        {...bind}
      >
        <span className={`acad-file__icon is-${item.kind}`}>
          <DocPageIcon size={20} />
        </span>
        <span className="acad-file__copy">
          <strong>{item.title}</strong>
          <small>{fileCaption(item.fileName)}</small>
        </span>
      </button>
      <button
        type="button"
        className="acad-file__more"
        aria-label={`Options for ${item.title}`}
        onClick={() => onMenu(item)}
      >
        <DotsIcon size={18} />
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
  updateModule,
  addMaterial,
  updateMaterial,
  removeMaterial,
}: AcademicsScreenProps) {
  const [owner, setOwner] = useState<Carer>('you')
  const [view, setView] = useState<View>({ mode: 'home' })
  const [showAllDeadlines, setShowAllDeadlines] = useState(false)
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [moduleCode, setModuleCode] = useState('')
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleTerm, setModuleTerm] = useState('')
  const [moduleColor, setModuleColor] = useState<ModuleColor>(DEFAULT_MODULE_COLOR)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
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
  const notes = useMemo(
    () => sortDeskFiles(moduleMaterials.filter((item) => item.kind === 'notes')),
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
    setModuleColor(DEFAULT_MODULE_COLOR)
    setEditingModuleId(null)
    setShowModuleForm(false)
  }

  function openAddModule() {
    setError('')
    setEditingModuleId(null)
    setModuleCode('')
    setModuleTitle('')
    setModuleTerm('')
    setModuleColor(DEFAULT_MODULE_COLOR)
    setShowModuleForm(true)
  }

  function openEditModule() {
    if (!activeModule) return
    setError('')
    setEditingModuleId(activeModule.id)
    setModuleCode(activeModule.code)
    setModuleTitle(activeModule.title)
    setModuleTerm(activeModule.term)
    setModuleColor(themeFromModule(activeModule))
    setShowModuleForm(true)
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
    if (editingModuleId) {
      const updated = await updateModule(editingModuleId, {
        code: moduleCode,
        title: moduleTitle,
        term: moduleTerm,
        color: moduleColor,
      })
      if (updated) resetModuleForm()
      return
    }
    const created = await addModule(owner, {
      code: moduleCode,
      title: moduleTitle,
      term: moduleTerm,
      color: moduleColor,
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

  function handleBack() {
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
  }

  const viewingName = owner === 'you' ? names.you : names.partner

  return (
    <div className="screen screen--academics">
      {view.mode === 'home' ? (
        <header className="acad-homebar">
          <button type="button" className="acad-homebar__btn" onClick={handleBack} aria-label="Back">
            <BackIcon size={22} />
          </button>
        </header>
      ) : (
        <header className="acad-modhead">
          <button type="button" className="acad-modhead__back" onClick={handleBack} aria-label="Back">
            <BackIcon size={22} />
          </button>
          <div className="acad-modhead__text">
            <h1>{activeModule?.code || activeModule?.title || 'Module'}</h1>
            {activeModule?.code && activeModule.title ? <p>{activeModule.title}</p> : null}
          </div>
          {activeModule ? (
            <button
              type="button"
              className="acad-modhead__edit"
              onClick={openEditModule}
              aria-label="Edit module"
            >
              <PencilIcon size={20} />
            </button>
          ) : null}
        </header>
      )}

      <ScrollRegion className="screen__scroll acad-scroll">
        {error ? (
          <p className="acad-error" role="alert">
            {error}
          </p>
        ) : null}

        {view.mode === 'home' ? (
          <>
            <div className="acad-switch-block">
              <div className="acad-switch" role="tablist" aria-label="Whose courses">
                <button
                  type="button"
                  role="tab"
                  aria-selected={owner === 'you'}
                  className={owner === 'you' ? 'is-on' : ''}
                  onClick={() => {
                    setOwner('you')
                    setShowAllDeadlines(false)
                  }}
                >
                  <span>{firstName(names.you).toLowerCase()}</span>
                </button>
                <button
                  type="button"
                  className="acad-switch__swap"
                  onClick={() => {
                    setOwner(owner === 'you' ? 'partner' : 'you')
                    setShowAllDeadlines(false)
                  }}
                  aria-label="Switch person"
                >
                  <SwapIcon size={13} />
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={owner === 'partner'}
                  className={owner === 'partner' ? 'is-on' : ''}
                  onClick={() => {
                    setOwner('partner')
                    setShowAllDeadlines(false)
                  }}
                >
                  <span>{firstName(names.partner).toLowerCase()}</span>
                </button>
              </div>
              <p className="acad-viewing">
                Viewing <b>{ownedLabel(viewingName)}</b> modules
              </p>
            </div>
            <StudyTogetherBanner />

            {!ready ? (
              <p className="acad-empty">Loading your desk…</p>
            ) : (
              <>
                <section className="acad-panel" aria-label="Upcoming Deadlines">
                  <header className="acad-panel__head">
                    <h2>
                      <CalendarIcon size={18} />
                      Upcoming Deadlines
                    </h2>
                    {upcoming.length > DEADLINE_PREVIEW ? (
                      <button
                        type="button"
                        className="acad-panel__link"
                        onClick={() => setShowAllDeadlines((open) => !open)}
                      >
                        {showAllDeadlines ? 'Show less' : 'View all'}
                        <span aria-hidden>›</span>
                      </button>
                    ) : null}
                  </header>
                  {upcoming.length === 0 ? (
                    <p className="acad-panel__empty">No open deadlines. You’re clear.</p>
                  ) : (
                    <ul className="acad-deadlines">
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
                  )}
                </section>

                <section className="acad-panel" aria-label="Your Modules">
                  <header className="acad-panel__head">
                    <h2>
                      <CapIcon size={18} />
                      Your Modules
                    </h2>
                    <button
                      type="button"
                      className="acad-panel__add"
                      onClick={openAddModule}
                      aria-label="Add module"
                    >
                      <PlusIcon size={16} />
                    </button>
                  </header>

                  {ownedModules.length === 0 ? (
                    <div className="acad-panel__empty-block">
                      <p>
                        Add {owner === 'you' ? 'your' : `${firstName(names.partner)}'s`} courses to
                        keep lectures, assignments, and notes in one place.
                      </p>
                      <button
                        type="button"
                        className="btn btn--primary acad-btn"
                        onClick={openAddModule}
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
                        const theme = themeFromModule(module)
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
                                  size={28}
                                />
                              </span>
                              <span className="acad-module__copy">
                                <strong>{module.title}</strong>
                                <small>
                                  {count} {count === 1 ? 'item' : 'items'}
                                </small>
                              </span>
                              <span className="acad-upcoming__code">{module.code || 'Module'}</span>
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
          <div className={`acad-module-view acad-theme-${themeFromModule(activeModule)}`}>
            <section className="acad-dueboard" aria-label="Upcoming deadlines">
              {deadlines.length === 0 ? (
                <p className="acad-dueboard__empty">No open deadlines. You’re clear.</p>
              ) : (
                <ul>
                  {deadlines.map((item) => (
                    <li key={item.id}>
                      <DeadlineCard
                        item={item}
                        module={activeModule}
                        layout="page"
                        clickable
                        onOpen={() => {
                          if (item.fileUrl) openViewer(item)
                          else openMenu(item)
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="acad-block" aria-label="Lectures">
              <header className="acad-block__head">
                <h2>Lectures</h2>
                <span className="acad-block__count">{lectures.length}</span>
              </header>
              <ul className="acad-files">
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
                    className="acad-fileadd"
                    onClick={() => openMaterialForm('lecture')}
                  >
                    <span className="acad-fileadd__plus">
                      <PlusIcon size={18} />
                    </span>
                    Add lecture
                  </button>
                </li>
              </ul>
            </section>

            <section className="acad-block" aria-label="Assignments">
              <header className="acad-block__head">
                <h2>Assignments</h2>
                <span className="acad-block__count">{assignments.length}</span>
              </header>
              <ul className="acad-files">
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
                    className="acad-fileadd"
                    onClick={() => openMaterialForm('assignment')}
                  >
                    <span className="acad-fileadd__plus">
                      <PlusIcon size={18} />
                    </span>
                    Add assignment
                  </button>
                </li>
              </ul>
            </section>

            <section className="acad-block" aria-label="Notes">
              <header className="acad-block__head">
                <h2>Notes</h2>
                <span className="acad-block__count">{notes.length}</span>
              </header>
              <ul className="acad-files">
                {notes.map((item) => (
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
                    className="acad-fileadd"
                    onClick={() => openMaterialForm('notes')}
                  >
                    <span className="acad-fileadd__plus">
                      <PlusIcon size={18} />
                    </span>
                    Add notes
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
        <div
          className="acad-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={editingModuleId ? 'Edit module' : 'Add module'}
        >
          <div className="acad-sheet__panel">
            <header className="acad-sheet__head">
              <h2>{editingModuleId ? 'Edit module' : 'New module'}</h2>
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
            <fieldset className="acad-colors">
              <legend>Color</legend>
              <div className="acad-colors__row" role="radiogroup" aria-label="Module color">
                {MODULE_COLORS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={moduleColor === item.id}
                    aria-label={item.label}
                    className={`acad-colors__dot${moduleColor === item.id ? ' is-on' : ''}`}
                    style={{ background: item.swatch }}
                    onClick={() => setModuleColor(item.id)}
                  />
                ))}
              </div>
            </fieldset>
            <button
              type="button"
              className="btn btn--primary acad-btn"
              onClick={() => void submitModule()}
              disabled={busy || !moduleTitle.trim()}
            >
              {busy ? 'Saving…' : editingModuleId ? 'Save changes' : 'Save module'}
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
              ? `Edit ${kindLabel(materialKind)}`
              : `Add ${kindLabel(materialKind)}`
          }
        >
          <div className="acad-sheet__panel">
            <header className="acad-sheet__head">
              <h2>
                {editingId
                  ? `Edit ${kindLabel(materialKind)}`
                  : `New ${kindLabel(materialKind)}`}
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
                  materialKind === 'assignment'
                    ? 'Problem set 2'
                    : materialKind === 'notes'
                      ? 'Week 3 summary'
                      : 'Week 3 slides'
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
                  : `Save ${kindLabel(materialKind)}`}
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
