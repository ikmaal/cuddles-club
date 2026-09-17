import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { HomePhotoCropSheet } from './HomePhotoCropSheet'
import { useHomePhoto } from '../hooks/useHomePhoto'
import { usePolaroidScenery } from '../hooks/usePolaroidScenery'
import { daysTogether } from '../hooks/useProfile'
import type { PolaroidSceneryItem } from '../types'

interface HomePolaroidSectionProps {
  since: string
  editingScenery: boolean
  onEditingSceneryChange: (editing: boolean) => void
}

function ScenerySticker({
  item,
  editing,
  onMove,
  onRemove,
  onCommit,
}: {
  item: PolaroidSceneryItem
  editing: boolean
  onMove: (id: string, patch: Partial<Pick<PolaroidSceneryItem, 'x' | 'y'>>) => void
  onRemove: (id: string) => void
  onCommit: () => void
}) {
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  )

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!editing) return
    event.stopPropagation()
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: item.x,
      originY: item.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const scene = event.currentTarget.closest('.home-polaroid__scene') as HTMLElement | null
    if (!scene) return
    const rect = scene.getBoundingClientRect()
    const dx = ((event.clientX - drag.startX) / rect.width) * 100
    const dy = ((event.clientY - drag.startY) / rect.height) * 100
    onMove(item.id, {
      x: Math.min(92, Math.max(2, drag.originX + dx)),
      y: Math.min(92, Math.max(2, drag.originY + dy)),
    })
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
    onCommit()
  }

  return (
    <div
      className={`home-polaroid__sticker${editing ? ' home-polaroid__sticker--editing' : ''}`}
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
        transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img src={item.src} alt="" draggable={false} />
      {editing ? (
        <button
          type="button"
          className="home-polaroid__sticker-remove"
          aria-label="Remove sticker"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onRemove(item.id)
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  )
}

export function HomePolaroidSection({
  since,
  editingScenery,
  onEditingSceneryChange,
}: HomePolaroidSectionProps) {
  const days = daysTogether(since)
  const { photo, photoKey, busy, saveDataUrl } = useHomePhoto()
  const scenery = usePolaroidScenery()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const stickerInputRef = useRef<HTMLInputElement>(null)
  const photoBtnRef = useRef<HTMLButtonElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropAspect, setCropAspect] = useState(1)

  function closeCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  function onPhotoPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !file.type.startsWith('image/')) return

    const button = photoBtnRef.current
    if (button && button.clientWidth > 0 && button.clientHeight > 0) {
      setCropAspect(button.clientWidth / button.clientHeight)
    } else {
      setCropAspect(1)
    }

    setCropSrc(URL.createObjectURL(file))
  }

  async function onStickerPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      await scenery.addFromFile(file)
    } catch {
      /* error state on hook */
    }
  }

  useEffect(() => {
    if (!editingScenery) return

    const onPaste = (event: ClipboardEvent) => {
      const clipboard = event.clipboardData
      if (!clipboard) return
      for (const entry of clipboard.items) {
        if (!entry.type.startsWith('image/')) continue
        const file = entry.getAsFile()
        if (!file) continue
        event.preventDefault()
        void scenery.addFromFile(file)
        break
      }
    }

    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [editingScenery, scenery.addFromFile])

  return (
    <>
      <section
        className={`home-polaroid${days === null ? ' home-polaroid--no-days' : ''}${editingScenery ? ' home-polaroid--editing' : ''}`}
        aria-label="Together"
      >
        {editingScenery ? (
          <p className="home-polaroid__hint">
            Add images or paste from your clipboard, then drag stickers around the Polaroid. Tap × to
            remove.
          </p>
        ) : null}

        {scenery.error ? (
          <p className="home-polaroid__error" role="alert">
            {scenery.error}
          </p>
        ) : null}

        <div
          ref={sceneRef}
          className="home-polaroid__scene"
          tabIndex={editingScenery ? 0 : undefined}
        >
          {scenery.items.map((item) => (
            <ScenerySticker
              key={item.id}
              item={item}
              editing={editingScenery}
              onMove={scenery.updateItem}
              onRemove={(id) => void scenery.removeItem(id)}
              onCommit={() => void scenery.commitItems()}
            />
          ))}

          <article className="home-polaroid__frame">
            <span className="home-polaroid__tape" aria-hidden />
            <button
              ref={photoBtnRef}
              type="button"
              className={`home-polaroid__photo${photo ? ' has-image' : ''}`}
              onClick={() => {
                if (editingScenery) return
                photoInputRef.current?.click()
              }}
              disabled={busy || Boolean(cropSrc)}
              aria-label={photo ? 'Change home photo' : 'Add a home photo'}
            >
              {photo ? (
                <img key={photoKey} src={photo} alt="" />
              ) : (
                <span className="home-polaroid__photo-empty">
                  <span className="home-polaroid__photo-plus" aria-hidden>
                    +
                  </span>
                  <span>{busy ? 'Saving…' : 'Add photo'}</span>
                </span>
              )}
            </button>

            <div className="home-polaroid__caption">
              {days !== null ? (
                <p className="home-polaroid__days">
                  {days} {days === 1 ? 'day' : 'days'} <span aria-hidden>♡</span>
                </p>
              ) : (
                <p className="home-polaroid__days home-polaroid__days--muted">Our photo</p>
              )}
            </div>
          </article>
        </div>

        {editingScenery ? (
          <div className="home-polaroid__actions">
            <button
              type="button"
              className="home-polaroid__action-btn"
              disabled={scenery.busy}
              onClick={() => stickerInputRef.current?.click()}
            >
              Add image
            </button>
            <button
              type="button"
              className="home-polaroid__action-btn home-polaroid__action-btn--secondary"
              onClick={() => onEditingSceneryChange(false)}
            >
              Done decorating
            </button>
          </div>
        ) : null}

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onPhotoPicked}
        />
        <input
          ref={stickerInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => void onStickerPicked(event)}
        />
      </section>

      {cropSrc ? (
        <HomePhotoCropSheet
          src={cropSrc}
          aspectRatio={cropAspect}
          busy={busy}
          onCancel={closeCrop}
          onConfirm={async (dataUrl) => {
            await saveDataUrl(dataUrl)
            closeCrop()
          }}
        />
      ) : null}
    </>
  )
}
