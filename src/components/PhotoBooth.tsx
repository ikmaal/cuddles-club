import { useEffect, useRef, useState } from 'react'
import { composeCuteStrip } from '../composeStrip'

interface PhotoBoothProps {
  busy: boolean
  onSave: (imageDataUrl: string, title: string) => Promise<boolean>
  onClose: () => void
}

type Phase = 'boot' | 'ready' | 'countdown' | 'flash' | 'review' | 'denied'

const TOTAL_SHOTS = 4
const COUNTDOWN_FROM = 3

export function PhotoBooth({ busy, onSave, onClose }: PhotoBoothProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const shotsRef = useRef<string[]>([])

  const [phase, setPhase] = useState<Phase>('boot')
  const [count, setCount] = useState(COUNTDOWN_FROM)
  const [shots, setShots] = useState<string[]>([])
  const [composed, setComposed] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [composing, setComposing] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
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
          setError('Camera access is needed for the booth. Check permissions and try again.')
        }
      }
    }

    void startCamera()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    if (phase !== 'countdown') return

    if (count <= 0) {
      captureShot()
      return
    }

    const id = window.setTimeout(() => setCount((value) => value - 1), 800)
    return () => window.clearTimeout(id)
  }, [phase, count])

  function captureShot() {
    const video = videoRef.current
    if (!video || video.readyState < 2) {
      setPhase('ready')
      setError('Camera was not ready. Try again.')
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 960
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setPhase('ready')
      return
    }

    // Mirror to match the preview the couple sees
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)

    setPhase('flash')
    const nextShots = [...shotsRef.current, dataUrl]
    shotsRef.current = nextShots
    setShots(nextShots)

    window.setTimeout(() => {
      if (nextShots.length >= TOTAL_SHOTS) {
        void finishStrip(nextShots)
      } else {
        setCount(COUNTDOWN_FROM)
        setPhase('countdown')
      }
    }, 280)
  }

  async function finishStrip(finalShots: string[]) {
    setComposing(true)
    setError('')
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      const image = await composeCuteStrip(finalShots, {
        title: 'Cuddles Club',
        takenAt: Date.now(),
      })
      setComposed(image)
      setTitle(defaultBoothTitle())
      setPhase('review')
    } catch {
      setError('Could not build the strip. Please try again.')
      setPhase('ready')
      // Restart camera if composition failed mid-flow
      void restartCamera()
    } finally {
      setComposing(false)
    }
  }

  async function restartCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setPhase('denied')
    }
  }

  function startSession() {
    setError('')
    shotsRef.current = []
    setShots([])
    setComposed('')
    setCount(COUNTDOWN_FROM)
    setPhase('countdown')
  }

  async function retake() {
    setComposed('')
    shotsRef.current = []
    setShots([])
    setError('')
    await restartCamera()
    setPhase('ready')
  }

  async function save() {
    if (!composed) return
    const ok = await onSave(composed, title)
    if (ok) onClose()
  }

  const shotIndex = shots.length

  return (
    <div className="booth" role="dialog" aria-modal aria-label="Photo booth">
      <header className="booth__bar">
        <button type="button" className="booth__text-btn" onClick={onClose}>
          Close
        </button>
        <div className="booth__title">
          <strong>Photo Booth</strong>
          <span>
            {phase === 'review'
              ? 'Your cute strip is ready'
              : phase === 'countdown' || phase === 'flash'
                ? `Shot ${Math.min(shotIndex + 1, TOTAL_SHOTS)} of ${TOTAL_SHOTS}`
                : 'Four snaps · one strip'}
          </span>
        </div>
        <span className="booth__bar-spacer" />
      </header>

      {error ? (
        <p className="booth__error" role="alert">
          {error}
        </p>
      ) : null}

      {phase === 'review' ? (
        <div className="booth__review">
          <div className="booth__strip-preview">
            <img src={composed} alt="Finished photostrip" />
          </div>
          <label className="field booth__name">
            <span>Name this strip</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={40}
              placeholder="Date night booth"
            />
          </label>
          <div className="booth__review-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void retake()}
              disabled={busy}
            >
              Retake
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void save()}
              disabled={busy || !title.trim()}
            >
              {busy ? 'Saving…' : 'Save strip'}
            </button>
          </div>
        </div>
      ) : (
        <div className="booth__stage">
          <div className={`booth__viewport ${phase === 'flash' ? 'is-flash' : ''}`}>
            <video ref={videoRef} className="booth__video" playsInline muted autoPlay />
            <div className="booth__frame" aria-hidden />

            {phase === 'boot' ? (
              <div className="booth__overlay">
                <p>Warming up the camera…</p>
              </div>
            ) : null}

            {phase === 'denied' ? (
              <div className="booth__overlay">
                <p>Camera blocked</p>
                <span>Allow camera access, then reopen the booth.</span>
              </div>
            ) : null}

            {phase === 'countdown' ? (
              <div className="booth__countdown" aria-live="polite">
                {count > 0 ? count : '♥'}
              </div>
            ) : null}

            {composing ? (
              <div className="booth__overlay">
                <p>Decorating your strip…</p>
              </div>
            ) : null}
          </div>

          <ul className="booth__thumbs" aria-label="Captured shots">
            {Array.from({ length: TOTAL_SHOTS }, (_, index) => (
              <li key={index} className={shots[index] ? 'is-filled' : ''}>
                {shots[index] ? (
                  <img src={shots[index]} alt={`Shot ${index + 1}`} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </li>
            ))}
          </ul>

          {phase === 'ready' ? (
            <button type="button" className="btn btn--primary booth__start" onClick={startSession}>
              Start booth
            </button>
          ) : null}

          {phase === 'countdown' || phase === 'flash' ? (
            <p className="booth__hint">Hold still — cute characters incoming</p>
          ) : null}
        </div>
      )}
    </div>
  )
}

function defaultBoothTitle(): string {
  const now = new Date()
  return `Booth · ${now.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}`
}
