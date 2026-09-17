import { useCallback, useEffect, useRef, useState, type ClipboardEvent as ReactClipboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
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

type TransformPatch = Partial<Pick<PolaroidSceneryItem, 'x' | 'y' | 'rotation' | 'scale'>>

function stickerCenter(el: HTMLElement): { x: number; y: number } {
  const rect = el.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function ScenerySticker({
  item,
  editing,
  selected,
  onSelect,
  onUpdate,
  onRemove,
  onCommit,
}: {
  item: PolaroidSceneryItem
  editing: boolean
  selected: boolean
  onSelect: () => void
  onUpdate: (id: string, patch: TransformPatch) => void
  onRemove: (id: string) => void
  onCommit: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  )
  const rotateRef = useRef<{ pointerId: number; startAngle: number; originRotation: number } | null>(null)
  const scaleRef = useRef<{ pointerId: number; startDist: number; originScale: number } | null>(null)

  function onBodyPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!editing) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.stopPropagation()
    onSelect()
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: item.x,
      originY: item.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const root = rootRef.current
    if (!root) return

    const drag = dragRef.current
    if (drag && drag.pointerId === event.pointerId) {
      const scene = root.closest('.home-polaroid__scene') as HTMLElement | null
      if (!scene) return
      const rect = scene.getBoundingClientRect()
      const dx = ((event.clientX - drag.startX) / rect.width) * 100
      const dy = ((event.clientY - drag.startY) / rect.height) * 100
      onUpdate(item.id, {
        x: Math.min(96, Math.max(2, drag.originX + dx)),
        y: Math.min(96, Math.max(2, drag.originY + dy)),
      })
      return
    }

    const rotate = rotateRef.current
    if (rotate && rotate.pointerId === event.pointerId) {
      const center = stickerCenter(root)
      const angle = Math.atan2(event.clientY - center.y, event.clientX - center.x)
      const delta = ((angle - rotate.startAngle) * 180) / Math.PI
      onUpdate(item.id, { rotation: rotate.originRotation + delta })
      return
    }

    const scale = scaleRef.current
    if (scale && scale.pointerId === event.pointerId) {
      const center = stickerCenter(root)
      const dist = Math.hypot(event.clientX - center.x, event.clientY - center.y)
      const next = scale.originScale * (dist / Math.max(scale.startDist, 8))
      onUpdate(item.id, { scale: Math.min(2.5, Math.max(0.35, next)) })
    }
  }

  function endPointer(event: ReactPointerEvent<HTMLElement>) {
    const id = event.pointerId
    const hadGesture =
      dragRef.current?.pointerId === id ||
      rotateRef.current?.pointerId === id ||
      scaleRef.current?.pointerId === id

    if (dragRef.current?.pointerId === id) dragRef.current = null
    if (rotateRef.current?.pointerId === id) rotateRef.current = null
    if (scaleRef.current?.pointerId === id) scaleRef.current = null

    if (event.currentTarget.hasPointerCapture(id)) {
      event.currentTarget.releasePointerCapture(id)
    }
    if (hadGesture) onCommit()
  }

  function onRotatePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!editing) return
    event.stopPropagation()
    onSelect()
    const root = rootRef.current
    if (!root) return
    const center = stickerCenter(root)
    rotateRef.current = {
      pointerId: event.pointerId,
      startAngle: Math.atan2(event.clientY - center.y, event.clientX - center.x),
      originRotation: item.rotation,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onScalePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!editing) return
    event.stopPropagation()
    onSelect()
    const root = rootRef.current
    if (!root) return
    const center = stickerCenter(root)
    scaleRef.current = {
      pointerId: event.pointerId,
      startDist: Math.hypot(event.clientX - center.x, event.clientY - center.y),
      originScale: item.scale,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  return (
    <div
      ref={rootRef}
      className={[
        'home-polaroid__sticker',
        editing ? 'home-polaroid__sticker--editing' : '',
        selected && editing ? 'home-polaroid__sticker--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
        transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
        zIndex: selected && editing ? 4 : 3,
      }}
    >
      <div
        className="home-polaroid__sticker-body"
        onPointerDown={onBodyPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <img src={item.src} alt="" draggable={false} />
      </div>

      {editing && selected ? (
        <>
          <button
            type="button"
            className="home-polaroid__sticker-handle home-polaroid__sticker-handle--rotate"
            aria-label="Rotate sticker"
            onPointerDown={onRotatePointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
          />
          <button
            type="button"
            className="home-polaroid__sticker-handle home-polaroid__sticker-handle--scale"
            aria-label="Resize sticker"
            onPointerDown={onScalePointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
          />
        </>
      ) : null}

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

async function readClipboardImage(): Promise<File | null> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.read) {
    try {
      const clipboardItems = await navigator.clipboard.read()
      for (const clip of clipboardItems) {
        for (const type of clip.types) {
          if (!type.startsWith('image/')) continue
          const blob = await clip.getType(type)
          const mime = blob.type || type
          return new File([blob], 'pasted.png', { type: mime })
        }
      }
    } catch {
      /* fall through */
    }
  }
  return null
}

function fileFromPasteEvent(event: ClipboardEvent): File | null {
  const data = event.clipboardData
  if (!data) return null

  if (data.files.length) {
    for (const file of data.files) {
      if (file.type.startsWith('image/')) return file
    }
  }

  for (const entry of data.items) {
    if (!entry.type.startsWith('image/')) continue
    const file = entry.getAsFile()
    if (file) return file
  }

  return null
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
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null)

  useEffect(() => {
    if (!editingScenery) setSelectedStickerId(null)
  }, [editingScenery])

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

  const addStickerFileStable = useCallback(
    async (file: File) => {
      const added = await scenery.addFromFile(file)
      if (added) setSelectedStickerId(added.id)
    },
    [scenery.addFromFile],
  )

  const addStickerRef = useRef(addStickerFileStable)
  addStickerRef.current = addStickerFileStable

  async function onStickerPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      await addStickerFileStable(file)
    } catch {
      /* error state on hook */
    }
  }

  async function pasteStickerImage() {
    scenery.setError('')
    const file = await readClipboardImage()
    if (file) {
      try {
        await addStickerFileStable(file)
      } catch {
        /* hook sets error */
      }
      return
    }
    sceneRef.current?.focus()
    scenery.setError('Copy an image first, then tap Paste — or use Add from gallery.')
  }

  function onScenePaste(event: ReactClipboardEvent<HTMLDivElement>) {
    const native = event.nativeEvent
    const file = fileFromPasteEvent(native)
    if (!file) return
    event.preventDefault()
    void addStickerFileStable(file)
  }

  useEffect(() => {
    if (!editingScenery) return

    const onPaste = (event: ClipboardEvent) => {
      const file = fileFromPasteEvent(event)
      if (!file) return
      event.preventDefault()
      void addStickerRef.current(file)
    }

    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [editingScenery])

  return (
    <>
      <section
        className={`home-polaroid${days === null ? ' home-polaroid--no-days' : ''}${editingScenery ? ' home-polaroid--editing' : ''}`}
        aria-label="Together"
      >
        {editingScenery ? (
          <p className="home-polaroid__hint">
            Add from gallery or paste a copied image. Tap a sticker to select it, then drag to move,
            use the handles to rotate or resize, or tap × to remove.
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
          onPaste={editingScenery ? onScenePaste : undefined}
          onPointerDown={
            editingScenery
              ? (event) => {
                  if (event.target === event.currentTarget) setSelectedStickerId(null)
                }
              : undefined
          }
        >
          {scenery.items.map((item) => (
            <ScenerySticker
              key={item.id}
              item={item}
              editing={editingScenery}
              selected={selectedStickerId === item.id}
              onSelect={() => setSelectedStickerId(item.id)}
              onUpdate={scenery.updateItem}
              onRemove={(id) => {
                if (selectedStickerId === id) setSelectedStickerId(null)
                void scenery.removeItem(id)
              }}
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
              Add from gallery
            </button>
            <button
              type="button"
              className="home-polaroid__action-btn home-polaroid__action-btn--secondary"
              disabled={scenery.busy}
              onClick={() => void pasteStickerImage()}
            >
              Paste image
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
