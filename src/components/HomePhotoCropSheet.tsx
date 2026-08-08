import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { clampPan, coverScale, cropCoverToDataUrl } from '../lib/homePhotoCrop'

interface HomePhotoCropSheetProps {
  src: string
  aspectRatio: number
  busy?: boolean
  onCancel: () => void
  onConfirm: (dataUrl: string) => void | Promise<void>
}

export function HomePhotoCropSheet({
  src,
  aspectRatio,
  busy = false,
  onCancel,
  onConfirm,
}: HomePhotoCropSheetProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [natural, setNatural] = useState({ width: 0, height: 0 })
  const [frame, setFrame] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setNatural({ width: 0, height: 0 })
  }, [src])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    const node = frameRef.current
    if (!node) return

    const measure = () => {
      setFrame({ width: node.clientWidth, height: node.clientHeight })
    }
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [src, aspectRatio])

  const ready = natural.width > 0 && frame.width > 0

  function constrain(nextZoom: number, nextPan: { x: number; y: number }) {
    if (!natural.width || !frame.width) return nextPan
    const scale = coverScale(natural.width, natural.height, frame.width, frame.height, nextZoom)
    return clampPan(
      nextPan.x,
      nextPan.y,
      natural.width,
      natural.height,
      frame.width,
      frame.height,
      scale,
    )
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (busy || !ready) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setPan(
      constrain(zoom, {
        x: drag.originX + (event.clientX - drag.startX),
        y: drag.originY + (event.clientY - drag.startY),
      }),
    )
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
    }
  }

  function onZoomChange(value: number) {
    const nextZoom = Math.min(3, Math.max(1, value))
    setZoom(nextZoom)
    setPan((prev) => constrain(nextZoom, prev))
  }

  async function confirm() {
    const img = imageRef.current
    if (!img?.naturalWidth || !ready || busy) return
    const dataUrl = cropCoverToDataUrl(img, frame.width, frame.height, pan.x, pan.y, zoom)
    await onConfirm(dataUrl)
  }

  const scale = ready
    ? coverScale(natural.width, natural.height, frame.width, frame.height, zoom)
    : 1
  const drawnW = natural.width * scale
  const drawnH = natural.height * scale
  const left = ready ? (frame.width - drawnW) / 2 + pan.x : 0
  const top = ready ? (frame.height - drawnH) / 2 + pan.y : 0

  return createPortal(
    <div className="sheet-backdrop home-crop-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="sheet home-crop-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-crop-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet__header">
          <div>
            <p className="eyebrow">Home photo</p>
            <h2 id="home-crop-title">Adjust crop</h2>
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        </div>

        <p className="home-crop__hint">Drag to reposition. This frame matches your home photo.</p>

        <div
          ref={frameRef}
          className="home-crop__frame"
          style={{ aspectRatio: String(aspectRatio) }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            ref={imageRef}
            src={src}
            alt=""
            draggable={false}
            className="home-crop__image"
            style={
              ready
                ? {
                    width: drawnW,
                    height: drawnH,
                    transform: `translate(${left}px, ${top}px)`,
                  }
                : undefined
            }
            onLoad={(event) => {
              const target = event.currentTarget
              setNatural({ width: target.naturalWidth, height: target.naturalHeight })
              setPan({ x: 0, y: 0 })
              setZoom(1)
            }}
          />
        </div>

        <label className="home-crop__zoom">
          <span>Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            disabled={!ready || busy}
            onChange={(event) => onZoomChange(Number(event.target.value))}
          />
        </label>

        <div className="home-crop__actions">
          <button
            type="button"
            className="btn btn--primary"
            disabled={!ready || busy}
            onClick={() => void confirm()}
          >
            {busy ? 'Saving…' : 'Use photo'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
