import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { composePolaroid } from '../composePolaroid'

interface PolaroidCameraProps {
  busy?: boolean
  onSave: (image: string, caption: string) => Promise<boolean>
  onClose: () => void
}

type Phase = 'boot' | 'ready' | 'flash' | 'developing' | 'review' | 'denied'

const MARKER_COLOR = '#111111'
/** Stroke width relative to polaroid canvas width (~750). */
const MARKER_WIDTH_RATIO = 0.018

export function PolaroidCamera({ busy = false, onSave, onClose }: PolaroidCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const baseImageRef = useRef<HTMLImageElement | null>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  const [phase, setPhase] = useState<Phase>('boot')
  const [facing, setFacing] = useState<'user' | 'environment'>('environment')
  const [cameraKey, setCameraKey] = useState(0)
  const [error, setError] = useState('')
  const [polaroid, setPolaroid] = useState('')
  const [hasInk, setHasInk] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function start() {
      setError('')
      setPhase('boot')
      try {
        streamRef.current?.getTracks().forEach((track) => track.stop())
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play()
        }
        setPhase('ready')
      } catch {
        if (!cancelled) {
          setPhase('denied')
          setError('Allow camera access to take a polaroid.')
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [facing, cameraKey])

  useEffect(() => {
    if (phase !== 'review' || !polaroid) return
    let cancelled = false

    void (async () => {
      try {
        const img = await loadImage(polaroid)
        if (cancelled) return
        baseImageRef.current = img
        const canvas = drawCanvasRef.current
        if (!canvas) return
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0)
        setHasInk(false)
      } catch {
        if (!cancelled) setError('Could not open that print for marking.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [phase, polaroid])

  function canvasPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = drawCanvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return null
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  function markerStyle(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    ctx.strokeStyle = MARKER_COLOR
    ctx.fillStyle = MARKER_COLOR
    ctx.lineWidth = Math.max(8, canvas.width * MARKER_WIDTH_RATIO)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }

  function beginStroke(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (saving || busy) return
    const canvas = drawCanvasRef.current
    const ctx = canvas?.getContext('2d')
    const point = canvasPoint(event)
    if (!canvas || !ctx || !point) return

    event.currentTarget.setPointerCapture(event.pointerId)
    drawingRef.current = true
    lastPointRef.current = point
    markerStyle(ctx, canvas)
    ctx.beginPath()
    ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2)
    ctx.fill()
    setHasInk(true)
  }

  function moveStroke(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    const canvas = drawCanvasRef.current
    const ctx = canvas?.getContext('2d')
    const point = canvasPoint(event)
    const last = lastPointRef.current
    if (!canvas || !ctx || !point || !last) return

    markerStyle(ctx, canvas)
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPointRef.current = point
  }

  function endStroke(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastPointRef.current = null
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* already released */
    }
  }

  function clearInk() {
    const canvas = drawCanvasRef.current
    const img = baseImageRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !img || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
    setHasInk(false)
  }

  async function snap() {
    const video = videoRef.current
    if (!video || phase !== 'ready') return

    setPhase('flash')
    const track = streamRef.current?.getVideoTracks()[0]
    const torchOn = await setTorch(track, true)

    window.setTimeout(() => {
      void (async () => {
        try {
          const image = await composePolaroid(video, {
            mirror: facing === 'user',
            sourceWidth: video.videoWidth,
            sourceHeight: video.videoHeight,
            flash: true,
          })
          await setTorch(track, false)
          setPhase('developing')
          streamRef.current?.getTracks().forEach((t) => t.stop())
          streamRef.current = null
          setPolaroid(image)
          setHasInk(false)
          window.setTimeout(() => setPhase('review'), torchOn ? 280 : 420)
        } catch (err) {
          await setTorch(track, false)
          setError(err instanceof Error ? err.message : 'Could not develop that polaroid')
          setPhase('ready')
        }
      })()
    }, 120)
  }

  async function save() {
    const canvas = drawCanvasRef.current
    if (!canvas || saving || busy) return
    setSaving(true)
    setError('')
    try {
      const finalImage = canvas.toDataURL('image/jpeg', 0.92)
      const ok = await onSave(finalImage, '')
      if (ok) onClose()
    } finally {
      setSaving(false)
    }
  }

  function retake() {
    setPolaroid('')
    setHasInk(false)
    baseImageRef.current = null
    setError('')
    setCameraKey((value) => value + 1)
  }

  const live = phase === 'boot' || phase === 'ready' || phase === 'flash'

  return (
    <div className="polaroid-cam" role="dialog" aria-modal="true" aria-label="Polaroid camera">
      <div className={`polaroid-cam__flash-burst${phase === 'flash' ? ' is-on' : ''}`} aria-hidden />
      <header className="polaroid-cam__header">
        <button type="button" className="polaroid-cam__text-btn" onClick={onClose}>
          Close
        </button>
        <div className="polaroid-cam__title">
          <p className="eyebrow">Moments</p>
          <h2>
            {phase === 'review'
              ? 'Write on it'
              : phase === 'developing'
                ? 'Developing…'
                : phase === 'denied'
                  ? 'Camera needed'
                  : 'Instant camera'}
          </h2>
        </div>
        {live ? (
          <button
            type="button"
            className="polaroid-cam__text-btn"
            onClick={() => setFacing((prev) => (prev === 'user' ? 'environment' : 'user'))}
          >
            Flip
          </button>
        ) : phase === 'review' ? (
          <button
            type="button"
            className="polaroid-cam__text-btn"
            onClick={clearInk}
            disabled={!hasInk || saving || busy}
          >
            Erase
          </button>
        ) : (
          <span className="polaroid-cam__spacer" />
        )}
      </header>

      {error ? <p className="polaroid-cam__error">{error}</p> : null}

      {phase === 'denied' ? (
        <div className="polaroid-cam__denied">
          <p>Camera access is needed to snap a polaroid.</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setCameraKey((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : null}

      <div className={`polaroid-cam__stage${live || phase === 'developing' ? '' : ' is-hidden'}`}>
        <div className={`polaroid-cam__viewfinder${phase === 'flash' ? ' is-flash' : ''}`}>
          <div className="polaroid-cam__frame">
            <video
              ref={videoRef}
              className={`polaroid-cam__video${facing === 'user' ? ' is-mirrored' : ''}`}
              playsInline
              muted
              autoPlay
            />
            <div className="polaroid-cam__glass" aria-hidden />
          </div>
        </div>
      </div>

      {live ? (
        <div className="polaroid-cam__controls">
          <button
            type="button"
            className="polaroid-cam__shutter"
            onClick={() => void snap()}
            disabled={phase !== 'ready'}
            aria-label="Take polaroid"
          />
          <p className="polaroid-cam__hint">Tap the shutter for an instant print</p>
        </div>
      ) : null}

      {phase === 'developing' ? (
        <div className="polaroid-cam__developing">
          <div className="polaroid-print polaroid-print--ghost">
            <div className="polaroid-print__photo" />
          </div>
          <p>Developing your print…</p>
        </div>
      ) : null}

      {phase === 'review' && polaroid ? (
        <div className="polaroid-cam__review">
          <div className="polaroid-cam__draw-wrap">
            <canvas
              ref={drawCanvasRef}
              className="polaroid-cam__draw-canvas"
              onPointerDown={beginStroke}
              onPointerMove={moveStroke}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
              aria-label="Draw on polaroid with black marker"
            />
          </div>
          <p className="polaroid-cam__marker-hint">
            <span className="polaroid-cam__marker-dot" aria-hidden />
            Black marker — scribble anywhere on the print
          </p>
          <div className="polaroid-cam__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={retake}
              disabled={saving || busy}
            >
              Retake
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void save()}
              disabled={saving || busy}
            >
              {saving || busy ? 'Saving…' : 'Save to Moments'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load polaroid'))
    img.src = src
  })
}

async function setTorch(track: MediaStreamTrack | undefined, on: boolean): Promise<boolean> {
  if (!track) return false
  try {
    const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean }
    if (!capabilities?.torch) return false
    await track.applyConstraints({
      advanced: [{ torch: on } as MediaTrackConstraintSet],
    })
    return true
  } catch {
    return false
  }
}
