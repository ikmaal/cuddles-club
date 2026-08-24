import { useEffect, useRef, useState } from 'react'
import { PhotoBooth } from '../components/PhotoBooth'
import {
  BackIcon,
  CameraIcon,
  PlusIcon,
  PoseIcon,
} from '../components/Icons'
import { StripViewer } from '../components/StripViewer'
import { PhotoboothBanner } from '../components/PhotoboothBanner'
import { MemoriesGallery } from '../components/MemoriesGallery'
import { MemoriesGalleryAll } from '../components/MemoriesGalleryAll'
import { useStored } from '../hooks/useStored'
import type { CoupleProfile, Photostrip } from '../types'
import { BoothPosesScreen } from './BoothPosesScreen'

interface StripsScreenProps {
  profile: CoupleProfile
  strips: Photostrip[]
  ready: boolean
  busy: boolean
  error: string
  onAdd: (file: File, title: string, takenAt?: number) => Promise<Photostrip | null>
  onAddBooth: (imageDataUrl: string, title: string) => Promise<boolean>
  onRename: (id: string, title: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onClearError: () => void
  onBack: () => void
}

const FAVORITES_KEY = 'cuddles-club-strip-favorites'

function formatTakenWhen(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function composeUploadTitle(when: string, where: string): string {
  const place = where.trim()
  const taken = when ? formatTakenWhen(when) : ''
  if (place && taken) return `${place} · ${taken}`.slice(0, 60)
  return (place || taken || 'Uploaded strip').slice(0, 60)
}

function takenAtFromDateInput(isoDate: string): number {
  const date = new Date(`${isoDate}T12:00:00`)
  return Number.isNaN(date.getTime()) ? Date.now() : date.getTime()
}

export function StripsScreen({
  profile: _profile,
  strips,
  ready,
  busy,
  error,
  onAdd,
  onAddBooth,
  onRename,
  onRemove,
  onClearError,
  onBack,
}: StripsScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [favorites, setFavorites] = useStored<string[]>(FAVORITES_KEY, [])
  const [takenWhen, setTakenWhen] = useState('')
  const [takenWhere, setTakenWhere] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [active, setActive] = useState<Photostrip | null>(null)
  const [boothOpen, setBoothOpen] = useState(false)
  const [posesOpen, setPosesOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [galleryAllOpen, setGalleryAllOpen] = useState(false)

  const canSaveUpload = Boolean(takenWhen && takenWhere.trim())

  useEffect(() => {
    if (!active) return
    const next = strips.find((strip) => strip.id === active.id)
    if (!next) {
      setActive(null)
      return
    }
    if (next !== active) setActive(next)
  }, [strips, active])

  if (posesOpen) {
    return <BoothPosesScreen onBack={() => setPosesOpen(false)} />
  }

  function pickFile() {
    onClearError()
    setAddOpen(false)
    inputRef.current?.click()
  }

  function openBooth() {
    onClearError()
    setAddOpen(false)
    setBoothOpen(true)
  }

  function openPoses() {
    setAddOpen(false)
    setPosesOpen(true)
  }

  function openAdd() {
    onClearError()
    setAddOpen(true)
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return
    setPendingFile(file)
    setTakenWhen('')
    setTakenWhere('')
    setPreview(URL.createObjectURL(file))
  }

  function cancelPending() {
    if (preview) URL.revokeObjectURL(preview)
    setPendingFile(null)
    setPreview('')
    setTakenWhen('')
    setTakenWhere('')
  }

  async function savePending(event: React.FormEvent) {
    event.preventDefault()
    if (!pendingFile || !canSaveUpload) return
    const title = composeUploadTitle(takenWhen, takenWhere)
    const saved = await onAdd(pendingFile, title, takenAtFromDateInput(takenWhen))
    if (saved) cancelPending()
  }

  function toggleFavorite(id: string) {
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function handleBack() {
    if (pendingFile) {
      cancelPending()
      return
    }
    if (addOpen) {
      setAddOpen(false)
      return
    }
    if (galleryAllOpen) {
      setGalleryAllOpen(false)
      return
    }
    onBack()
  }

  return (
    <div className="screen screen--strips">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onFileChange}
      />

      <div className="booth-home">
        {galleryAllOpen ? (
          <MemoriesGalleryAll
            strips={strips}
            onBack={() => setGalleryAllOpen(false)}
            onOpen={setActive}
          />
        ) : (
          <>
            <header className="booth-homebar">
              <button type="button" className="booth-back" onClick={handleBack} aria-label="Back">
                <BackIcon size={20} />
              </button>
            </header>

            <PhotoboothBanner />

            {error ? (
              <p className="strip-error" role="alert">
                {error}
              </p>
            ) : null}

            <nav className="booth-docks" aria-label="Photobooth">
              <button type="button" className="booth-dock" onClick={openAdd} disabled={busy}>
                <span className="booth-dock__icon">
                  <PlusIcon size={22} />
                </span>
                <span>add</span>
              </button>
              <button type="button" className="booth-dock" onClick={openPoses}>
                <span className="booth-dock__icon">
                  <PoseIcon size={22} />
                </span>
                <span>poses</span>
              </button>
            </nav>

            <MemoriesGallery
              strips={strips}
              favorites={favorites}
              ready={ready}
              onOpen={setActive}
              onToggleFavorite={toggleFavorite}
              onViewAll={() => setGalleryAllOpen(true)}
            />
          </>
        )}
      </div>

      {addOpen ? (
        <div className="booth-sheet" role="dialog" aria-modal="true" aria-label="Add a strip">
          <button
            type="button"
            className="booth-sheet__scrim"
            aria-label="Close"
            onClick={() => setAddOpen(false)}
          />
          <div className="booth-sheet__panel">
            <h2>new strip</h2>
            <button type="button" onClick={openBooth} disabled={busy}>
              <CameraIcon size={18} />
              Open booth
            </button>
            <button type="button" onClick={pickFile} disabled={busy}>
              <PlusIcon size={18} />
              Upload strip
            </button>
          </div>
        </div>
      ) : null}

      {pendingFile ? (
        <div className="booth-sheet" role="dialog" aria-modal="true" aria-label="Save uploaded strip">
          <button
            type="button"
            className="booth-sheet__scrim"
            aria-label="Close"
            onClick={cancelPending}
          />
          <form className="booth-sheet__panel booth-sheet__panel--form" onSubmit={savePending}>
            <h2>new album page</h2>
            <div className="booth-upload-preview">
              <img src={preview} alt="New strip preview" />
            </div>
            <label className="field">
              <span>When was it taken?</span>
              <input
                type="date"
                value={takenWhen}
                onChange={(event) => setTakenWhen(event.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                required
                autoFocus
              />
            </label>
            <label className="field">
              <span>Where was it taken?</span>
              <input
                value={takenWhere}
                onChange={(event) => setTakenWhere(event.target.value)}
                maxLength={40}
                placeholder="Night market, JB"
                required
              />
            </label>
            <div className="booth-sheet__actions">
              <button type="button" className="btn btn--ghost btn--sm" onClick={cancelPending} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary btn--sm" disabled={busy || !canSaveUpload}>
                {busy ? 'Saving…' : 'Add to album'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {boothOpen ? (
        <PhotoBooth busy={busy} onSave={onAddBooth} onClose={() => setBoothOpen(false)} />
      ) : null}

      {active ? (
        <StripViewer
          strip={active}
          favorited={favorites.includes(active.id)}
          onClose={() => setActive(null)}
          onRename={onRename}
          onRemove={onRemove}
          onToggleFavorite={toggleFavorite}
        />
      ) : null}
    </div>
  )
}
