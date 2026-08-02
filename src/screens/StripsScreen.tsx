import { useRef, useState } from 'react'
import { PlusIcon, TrashIcon } from '../components/Icons'
import { ScreenHeader } from '../components/ScreenHeader'
import { StripViewer } from '../components/StripViewer'
import { formatRelative } from '../hooks/useStored'
import type { Photostrip } from '../types'

interface StripsScreenProps {
  strips: Photostrip[]
  ready: boolean
  busy: boolean
  error: string
  onAdd: (file: File, title: string) => Promise<Photostrip | null>
  onRename: (id: string, title: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onClearError: () => void
  onBack: () => void
}

export function StripsScreen({
  strips,
  ready,
  busy,
  error,
  onAdd,
  onRename,
  onRemove,
  onClearError,
  onBack,
}: StripsScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [active, setActive] = useState<Photostrip | null>(null)

  function pickFile() {
    onClearError()
    inputRef.current?.click()
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      return
    }
    setPendingFile(file)
    setTitle(file.name.replace(/\.[^.]+$/, '').slice(0, 40))
    setPreview(URL.createObjectURL(file))
  }

  function cancelPending() {
    if (preview) URL.revokeObjectURL(preview)
    setPendingFile(null)
    setPreview('')
    setTitle('')
  }

  async function savePending(event: React.FormEvent) {
    event.preventDefault()
    if (!pendingFile) return
    const saved = await onAdd(pendingFile, title)
    if (saved) cancelPending()
  }

  return (
    <div className="screen">
      <ScreenHeader
        title="Photo Strips"
        subtitle="Your booth strips, kept together"
        onBack={onBack}
        action={
          <button
            type="button"
            className="strip-add-btn"
            onClick={pickFile}
            disabled={busy}
            aria-label="Add a photo strip"
          >
            <PlusIcon size={20} />
          </button>
        }
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onFileChange}
      />

      <div className="screen__scroll">
        {error ? (
          <p className="strip-error" role="alert">
            {error}
          </p>
        ) : null}

        {pendingFile ? (
          <form className="surface strip-compose" onSubmit={savePending}>
            <div className="strip-compose__preview">
              <img src={preview} alt="New strip preview" />
            </div>
            <label className="field">
              <span>Name this strip</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={40}
                placeholder="Night market, Dec 2025"
                autoFocus
              />
            </label>
            <div className="strip-compose__actions">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={cancelPending}
                disabled={busy}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn--primary btn--sm" disabled={busy}>
                {busy ? 'Saving…' : 'Save strip'}
              </button>
            </div>
          </form>
        ) : null}

        {!ready ? (
          <div className="empty">
            <p className="empty__title">Loading strips…</p>
          </div>
        ) : strips.length === 0 && !pendingFile ? (
          <div className="empty">
            <p className="empty__title">No strips yet</p>
            <p className="empty__body">
              Snap or upload a photo booth strip, then spin it around in 3D.
            </p>
            <button type="button" className="btn btn--primary btn--sm" onClick={pickFile}>
              Add your first strip
            </button>
          </div>
        ) : (
          <ul className="strip-grid">
            {strips.map((strip) => (
              <li key={strip.id}>
                <button
                  type="button"
                  className="strip-tile"
                  onClick={() => setActive(strip)}
                >
                  <span className="strip-tile__frame">
                    <img src={strip.image} alt="" />
                  </span>
                  <span className="strip-tile__meta">
                    <strong>{strip.title}</strong>
                    <small>{formatRelative(strip.createdAt)}</small>
                  </span>
                </button>
                <div className="strip-tile__actions">
                  <button
                    type="button"
                    className="ghost-icon"
                    onClick={() => {
                      const next = window.prompt('Rename this strip', strip.title)
                      if (next) void onRename(strip.id, next)
                    }}
                    aria-label={`Rename ${strip.title}`}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="ghost-icon"
                    onClick={() => {
                      if (window.confirm(`Remove “${strip.title}”?`)) {
                        void onRemove(strip.id)
                      }
                    }}
                    aria-label={`Delete ${strip.title}`}
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {strips.length > 0 ? (
          <p className="fineprint">
            Tap a strip to spin it in 3D. Photos stay on this device only.
          </p>
        ) : null}
      </div>

      {active ? <StripViewer strip={active} onClose={() => setActive(null)} /> : null}
    </div>
  )
}
