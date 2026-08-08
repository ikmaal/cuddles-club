import { useMemo, useRef, useState } from 'react'
import { PhotoBooth } from '../components/PhotoBooth'
import { ScrollRegion } from '../components/ScrollRegion'
import { PlusIcon, StripIcon, TrashIcon } from '../components/Icons'
import { ScreenHeader } from '../components/ScreenHeader'
import { StripViewer } from '../components/StripViewer'
import { formatRelative } from '../hooks/useStored'
import type { CoupleProfile, Photostrip } from '../types'

interface StripsScreenProps {
  profile: CoupleProfile
  strips: Photostrip[]
  ready: boolean
  busy: boolean
  error: string
  onAdd: (file: File, title: string) => Promise<Photostrip | null>
  onAddBooth: (imageDataUrl: string, title: string) => Promise<boolean>
  onRename: (id: string, title: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onClearError: () => void
  onBack: () => void
}

function formatAlbumDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function albumDateRange(strips: Photostrip[]): string | null {
  if (strips.length === 0) return null
  const sorted = [...strips].sort((a, b) => a.createdAt - b.createdAt)
  const first = formatAlbumDate(sorted[0].createdAt)
  const last = formatAlbumDate(sorted[sorted.length - 1].createdAt)
  return first === last ? first : `${first} – ${last}`
}

export function StripsScreen({
  profile,
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
  const [title, setTitle] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [active, setActive] = useState<Photostrip | null>(null)
  const [boothOpen, setBoothOpen] = useState(false)

  const coverStrip = strips[0] ?? null
  const dateRange = useMemo(() => albumDateRange(strips), [strips])
  const photoCount = strips.length * 4

  function pickFile() {
    onClearError()
    inputRef.current?.click()
  }

  function openBooth() {
    onClearError()
    setBoothOpen(true)
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
    <div className="screen screen--strips">
      <ScreenHeader
        title="Photobooth"
        subtitle="Black & white booth nights, kept forever"
        onBack={onBack}
        action={
          <button
            type="button"
            className="strip-add-btn"
            onClick={pickFile}
            disabled={busy}
            aria-label="Upload a photobooth strip"
            title="Upload"
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

      <ScrollRegion className="screen__scroll">
        <section className="album-cover" aria-label="Album cover">
          <div className="album-cover__spine" aria-hidden />
          <div className="album-cover__face">
            <div className="album-cover__peek" aria-hidden>
              {coverStrip ? (
                <img src={coverStrip.image} alt="" />
              ) : (
                <span className="album-cover__empty">
                  <StripIcon size={28} />
                </span>
              )}
            </div>
            <div className="album-cover__info">
              <p className="album-cover__eyebrow">Film album</p>
              <h2>
                {profile.nameYou} & {profile.namePartner}
              </h2>
              <p className="album-cover__blurb">
                {strips.length > 0
                  ? 'Every flash, every strip — filed in monochrome.'
                  : 'Open the booth for four frames, or upload a strip you love.'}
              </p>
              <dl className="album-cover__stats">
                <div>
                  <dt>Strips</dt>
                  <dd>{ready ? strips.length : '—'}</dd>
                </div>
                <div>
                  <dt>Photos</dt>
                  <dd>{ready ? photoCount : '—'}</dd>
                </div>
                <div>
                  <dt>Span</dt>
                  <dd>{dateRange ?? '—'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <div className="album-toolbar">
          <button
            type="button"
            className="album-toolbar__btn album-toolbar__btn--primary"
            onClick={openBooth}
            disabled={busy}
          >
            <StripIcon size={18} />
            Open booth
          </button>
          <button
            type="button"
            className="album-toolbar__btn"
            onClick={pickFile}
            disabled={busy}
          >
            <PlusIcon size={18} />
            Upload strip
          </button>
        </div>

        {error ? (
          <p className="strip-error" role="alert">
            {error}
          </p>
        ) : null}

        {pendingFile ? (
          <form className="surface album-compose" onSubmit={savePending}>
            <p className="album-compose__label">New album page</p>
            <div className="album-compose__preview">
              <img src={preview} alt="New strip preview" />
            </div>
            <label className="field">
              <span>Caption this strip</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={40}
                placeholder="Night market, Dec 2025"
                autoFocus
              />
            </label>
            <div className="album-compose__actions">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={cancelPending}
                disabled={busy}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn--primary btn--sm" disabled={busy}>
                {busy ? 'Saving…' : 'Add to album'}
              </button>
            </div>
          </form>
        ) : null}

        {!ready ? (
          <div className="empty">
            <p className="empty__title">Opening album…</p>
          </div>
        ) : strips.length === 0 && !pendingFile ? (
          <div className="album-empty">
            <p className="album-empty__title">No strips developed yet</p>
            <p className="album-empty__body">
              Snap four frames in the booth, or upload a strip to start the album.
            </p>
          </div>
        ) : strips.length > 0 ? (
          <section className="album-shelf" aria-label="Album pages">
            <header className="album-shelf__head">
              <h3>Contact sheets</h3>
              <p>{strips.length} page{strips.length === 1 ? '' : 's'}</p>
            </header>
            <ul className="album-pages">
              {strips.map((strip, index) => (
                <li
                  key={strip.id}
                  className="album-page"
                  style={{ '--page-tilt': `${((index % 3) - 1) * 0.6}deg` } as React.CSSProperties}
                >
                  <button
                    type="button"
                    className="album-page__open"
                    onClick={() => setActive(strip)}
                  >
                    <span className="album-page__paper">
                      <span className="album-page__mount album-page__mount--tl" aria-hidden />
                      <span className="album-page__mount album-page__mount--tr" aria-hidden />
                      <span className="album-page__strip">
                        <img src={strip.image} alt="" />
                      </span>
                      <span className="album-page__caption">
                        <strong>{strip.title}</strong>
                        <small>{formatRelative(strip.createdAt)}</small>
                      </span>
                    </span>
                  </button>
                  <div className="album-page__actions">
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
          </section>
        ) : null}

        {strips.length > 0 ? (
          <p className="fineprint">
            Tap a page to view the strip in 3D. Kept on this device only.
          </p>
        ) : null}
      </ScrollRegion>

      {boothOpen ? (
        <PhotoBooth
          busy={busy}
          onSave={onAddBooth}
          onClose={() => setBoothOpen(false)}
        />
      ) : null}

      {active ? <StripViewer strip={active} onClose={() => setActive(null)} /> : null}
    </div>
  )
}
