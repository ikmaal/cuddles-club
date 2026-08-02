import { useEffect, useRef, useState } from 'react'
import type { Photostrip } from '../types'

interface StripViewerProps {
  strip: Photostrip
  onClose: () => void
}

const MIN_ZOOM = 0.7
const MAX_ZOOM = 2.4

export function StripViewer({ strip, onClose }: StripViewerProps) {
  const [rotateX, setRotateX] = useState(-8)
  const [rotateY, setRotateY] = useState(-18)
  const [zoom, setZoom] = useState(1)
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const pinch = useRef<number | null>(null)
  const stage = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function startDrag(clientX: number, clientY: number) {
    dragging.current = true
    last.current = { x: clientX, y: clientY }
  }

  function moveDrag(clientX: number, clientY: number) {
    if (!dragging.current) return
    const dx = clientX - last.current.x
    const dy = clientY - last.current.y
    last.current = { x: clientX, y: clientY }
    setRotateY((value) => value + dx * 0.45)
    setRotateX((value) => clamp(value - dy * 0.35, -55, 55))
  }

  function endDrag() {
    dragging.current = false
  }

  function onWheel(event: React.WheelEvent) {
    event.preventDefault()
    const next = zoom + (event.deltaY < 0 ? 0.08 : -0.08)
    setZoom(clamp(next, MIN_ZOOM, MAX_ZOOM))
  }

  function onTouchStart(event: React.TouchEvent) {
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      startDrag(touch.clientX, touch.clientY)
      pinch.current = null
    } else if (event.touches.length === 2) {
      dragging.current = false
      pinch.current = distance(event.touches[0], event.touches[1])
    }
  }

  function onTouchMove(event: React.TouchEvent) {
    if (event.touches.length === 1 && dragging.current) {
      const touch = event.touches[0]
      moveDrag(touch.clientX, touch.clientY)
    } else if (event.touches.length === 2 && pinch.current) {
      const next = distance(event.touches[0], event.touches[1])
      const ratio = next / pinch.current
      pinch.current = next
      setZoom((value) => clamp(value * ratio, MIN_ZOOM, MAX_ZOOM))
    }
  }

  function reset() {
    setRotateX(-8)
    setRotateY(-18)
    setZoom(1)
  }

  return (
    <div className="strip-viewer" role="dialog" aria-modal aria-label={strip.title}>
      <header className="strip-viewer__bar">
        <button type="button" className="strip-viewer__text-btn" onClick={onClose}>
          Close
        </button>
        <div className="strip-viewer__title">
          <strong>{strip.title}</strong>
          <span>Drag to spin · pinch or scroll to zoom</span>
        </div>
        <button type="button" className="strip-viewer__text-btn" onClick={reset}>
          Reset
        </button>
      </header>

      <div
        ref={stage}
        className="strip-viewer__stage"
        onWheel={onWheel}
        onPointerDown={(event) => {
          if (event.pointerType === 'touch') return
          stage.current?.setPointerCapture(event.pointerId)
          startDrag(event.clientX, event.clientY)
        }}
        onPointerMove={(event) => {
          if (event.pointerType === 'touch') return
          moveDrag(event.clientX, event.clientY)
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={endDrag}
      >
        <div
          className="strip-viewer__scene"
          style={{
            transform: `scale(${zoom}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          }}
        >
          <div className="strip-card">
            <div className="strip-card__face strip-card__face--front">
              <img src={strip.image} alt={strip.title} draggable={false} />
            </div>
            <div className="strip-card__face strip-card__face--back" aria-hidden>
              <div className="strip-card__back-inner">
                <span>Cuddles Club</span>
                <strong>{strip.title}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function distance(
  a: { clientX: number; clientY: number },
  b: { clientX: number; clientY: number },
): number {
  const dx = a.clientX - b.clientX
  const dy = a.clientY - b.clientY
  return Math.hypot(dx, dy)
}
