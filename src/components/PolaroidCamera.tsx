import { useEffect, useRef, useState } from 'react'
import { CAPTION_BAND_TOP_RATIO, composePolaroid } from '../composePolaroid'

interface PolaroidCameraProps {
  busy?: boolean
  onSave: (image: string, caption: string) => Promise<boolean>
  onClose: () => void
}

type Phase = 'boot' | 'ready' | 'flash' | 'developing' | 'review' | 'denied'

export function PolaroidCamera({ busy = false, onSave, onClose }: PolaroidCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [phase, setPhase] = useState<Phase>('boot')
  const [facing, setFacing] = useState<'user' | 'environment'>('environment')
  const [cameraKey, setCameraKey] = useState(0)
  const [error, setError] = useState('')
  const [polaroid, setPolaroid] = useState('')
  const [caption, setCaption] = useState('')
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

  async function snap() {
    const video = videoRef.current
    if (!video || phase !== 'ready') return

    setPhase('flash')
    const track = streamRef.current?.getVideoTracks()[0]
    const torchOn = await setTorch(track, true)

    // Let the flash / torch settle, then grab the frame.
    window.setTimeout(() => {
      void (async () => {
        try {
          const image = await composePolaroid(video, {
            mirror: facing === 'user',
            sourceWidth: video.videoWidth,
            sourceHeight: video.videoHeight,
            takenAt: Date.now(),
            flash: true,
          })
          await setTorch(track, false)
          setPhase('developing')
          streamRef.current?.getTracks().forEach((t) => t.stop())
          streamRef.current = null
          setPolaroid(image)
          setCaption('')
          // Brief develop beat, then review
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
    if (!polaroid || saving || busy) return
    setSaving(true)
    setError('')
    try {
      const finalImage = caption.trim()
        ? await stampCaption(polaroid, caption.trim())
        : polaroid
      const ok = await onSave(finalImage, caption)
      if (ok) onClose()
    } finally {
      setSaving(false)
    }
  }

  function retake() {
    setPolaroid('')
    setCaption('')
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
              ? 'Your print'
              : phase === 'developing'
                ? 'Developing…'
                : phase === 'denied'
                  ? 'Camera needed'
                  : 'Instant camera'}
          </h2>
        </div>
        {live && phase !== 'denied' ? (
          <button
            type="button"
            className="polaroid-cam__text-btn"
            onClick={() => setFacing((prev) => (prev === 'user' ? 'environment' : 'user'))}
          >
            Flip
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
          <div className="polaroid-print polaroid-print--reveal">
            <img src={polaroid} alt="Developed polaroid" />
          </div>
          <label className="polaroid-cam__caption field">
            <span>Caption</span>
            <input
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={48}
              placeholder="Optional note on the print"
            />
          </label>
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

async function stampCaption(polaroidDataUrl: string, caption: string): Promise<string> {
  const img = await loadImage(polaroidDataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return polaroidDataUrl

  ctx.drawImage(img, 0, 0)

  const bandTop = Math.round(img.height * CAPTION_BAND_TOP_RATIO)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, bandTop, img.width, img.height - bandTop)

  ctx.fillStyle = '#2a2a2a'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const mid = bandTop + (img.height - bandTop) / 2
  ctx.font = '600 36px "Fredoka", system-ui, sans-serif'
  ctx.fillText(caption.slice(0, 28), img.width / 2, mid - 16)
  ctx.font = '500 20px "Fredoka", system-ui, sans-serif'
  ctx.globalAlpha = 0.5
  ctx.fillText(
    new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    img.width / 2,
    mid + 24,
  )
  ctx.globalAlpha = 1

  return canvas.toDataURL('image/jpeg', 0.9)
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
