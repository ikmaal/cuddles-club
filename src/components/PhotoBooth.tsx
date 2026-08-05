import { useEffect, useRef, useState } from 'react'
import { composeCuteStrip } from '../composeStrip'
import { loadStripDesignPreviews } from '../stripDesignPreviews'
import {
  DEFAULT_STRIP_DESIGN,
  STRIP_DESIGNS,
  type StripDesignId,
} from '../stripDesigns'

interface PhotoBoothProps {
  busy: boolean
  onSave: (imageDataUrl: string, title: string) => Promise<boolean>
  onClose: () => void
}

type Phase =
  | 'boot'
  | 'pick-design'
  | 'ready'
  | 'countdown'
  | 'flash'
  | 'review'
  | 'denied'

const TOTAL_SHOTS = 4
const COUNTDOWN_FROM = 5
const COUNTDOWN_TICK_MS = 1000

export function PhotoBooth({ busy, onSave, onClose }: PhotoBoothProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const shotsRef = useRef<string[]>([])

  const [phase, setPhase] = useState<Phase>('pick-design')
  const [count, setCount] = useState(COUNTDOWN_FROM)
  const [shots, setShots] = useState<string[]>([])
  const [composed, setComposed] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [composing, setComposing] = useState(false)
  const [design, setDesign] = useState<StripDesignId>(DEFAULT_STRIP_DESIGN)
  const [designPreviews, setDesignPreviews] = useState<Partial<Record<StripDesignId, string>>>(
    {},
  )
  const [previewsLoading, setPreviewsLoading] = useState(true)

  useEffect(() => {
    let alive = true
    loadStripDesignPreviews()
      .then((previews) => {
        if (alive) setDesignPreviews(previews)
      })
      .catch(() => {
        // Previews are optional; picker still works without them
      })
      .finally(() => {
        if (alive) setPreviewsLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

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
        setPhase('pick-design')
        // Video stays mounted (hidden during design pick) — attach on next frame.
        window.requestAnimationFrame(() => {
          void attachStreamToVideo()
        })
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
    if (phase !== 'ready') return
    void attachStreamToVideo()
  }, [phase])

  useEffect(() => {
    if (phase !== 'countdown') return

    if (count <= 0) {
      void captureShot()
      return
    }

    const id = window.setTimeout(() => setCount((value) => value - 1), COUNTDOWN_TICK_MS)
    return () => window.clearTimeout(id)
  }, [phase, count])

  async function attachStreamToVideo(): Promise<boolean> {
    const stream = streamRef.current
    const video = videoRef.current
    if (!stream || !video) return false

    if (video.srcObject !== stream) {
      video.srcObject = stream
    }

    try {
      await video.play()
    } catch {
      // Autoplay may be blocked until the element is visible; frames can still load.
    }

    return waitForVideoReady(video)
  }

  function waitForVideoReady(video: HTMLVideoElement, timeoutMs = 5000): Promise<boolean> {
    if (video.readyState >= 2 && video.videoWidth > 0) {
      return Promise.resolve(true)
    }

    return new Promise((resolve) => {
      function done(ok: boolean) {
        window.clearTimeout(timeout)
        video.removeEventListener('loadeddata', onReady)
        video.removeEventListener('canplay', onReady)
        resolve(ok)
      }

      function onReady() {
        if (video.readyState >= 2 && video.videoWidth > 0) {
          done(true)
        }
      }

      const timeout = window.setTimeout(() => {
        done(video.readyState >= 2 && video.videoWidth > 0)
      }, timeoutMs)

      video.addEventListener('loadeddata', onReady)
      video.addEventListener('canplay', onReady)
      onReady()
    })
  }

  async function captureShot() {
    const ready = await attachStreamToVideo()
    const video = videoRef.current
    if (!ready || !video || video.readyState < 2 || video.videoWidth === 0) {
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
        design,
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
      await attachStreamToVideo()
    } catch {
      setPhase('denied')
    }
  }

  async function startSession() {
    setError('')
    shotsRef.current = []
    setShots([])
    setComposed('')
    setCount(COUNTDOWN_FROM)

    const ready = await attachStreamToVideo()
    if (!ready) {
      setError('Camera was not ready. Try again.')
      return
    }

    setPhase('countdown')
  }

  async function retake() {
    setComposed('')
    shotsRef.current = []
    setShots([])
    setError('')
    await restartCamera()
    setPhase('pick-design')
  }

  function continueToBooth() {
    setError('')
    setPhase('ready')
    void attachStreamToVideo()
  }

  async function save() {
    if (!composed) return
    const ok = await onSave(composed, title)
    if (ok) onClose()
  }

  const shotIndex = shots.length
  const selectedDesign = STRIP_DESIGNS.find((item) => item.id === design)
  const showLiveCamera =
    phase === 'ready' || phase === 'countdown' || phase === 'flash' || phase === 'boot'

  return (
    <div className="booth" role="dialog" aria-modal aria-label="Photobooth">
      <header className="booth__bar">
        <button type="button" className="booth__text-btn" onClick={onClose}>
          Close
        </button>
        <div className="booth__title">
          <strong>Photobooth</strong>
          <span>
            {phase === 'pick-design'
              ? 'Pick your strip design'
              : phase === 'review'
                ? 'Your strip is ready'
                : phase === 'countdown' || phase === 'flash'
                  ? `Shot ${Math.min(shotIndex + 1, TOTAL_SHOTS)} of ${TOTAL_SHOTS}`
                  : selectedDesign
                    ? `${selectedDesign.label} · 4 snaps`
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

      {phase === 'pick-design' || phase === 'denied' ? (
        <div className="booth__designs">
          {phase === 'denied' ? (
            <div className="booth__denied-panel">
              <p className="booth__denied-title">Camera blocked</p>
              <p className="booth__denied-body">
                Allow camera access in your browser settings, then reopen the booth.
              </p>
            </div>
          ) : (
            <>
              <p className="booth__designs-lead">
                Choose a style for your strip before the camera starts.
              </p>
              <ul className="booth__design-grid" role="listbox" aria-label="Strip designs">
                {STRIP_DESIGNS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={design === item.id}
                      className={`booth__design-card ${design === item.id ? 'is-selected' : ''}`}
                      onClick={() => setDesign(item.id)}
                    >
                      <span className="booth__design-preview-wrap" aria-hidden>
                        {designPreviews[item.id] ? (
                          <img
                            className="booth__design-preview"
                            src={designPreviews[item.id]}
                            alt=""
                          />
                        ) : (
                          <span
                            className={`booth__design-preview booth__design-preview--loading ${previewsLoading ? 'is-loading' : ''}`}
                            style={{
                              background: `linear-gradient(160deg, ${item.swatch[0]} 0%, ${item.swatch[1]} 55%, ${item.swatch[2]} 100%)`,
                            }}
                          />
                        )}
                      </span>
                      <span className="booth__design-copy">
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn--primary booth__design-continue"
                onClick={continueToBooth}
              >
                Continue to booth
              </button>
            </>
          )}
        </div>
      ) : null}

      {phase === 'review' ? (
        <div className="booth__review">
          <div className="booth__strip-preview">
            <img src={composed} alt="Finished photobooth strip" />
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
      ) : null}

      <div
        className={`booth__camera-host ${showLiveCamera ? 'is-live' : 'is-sink'}`}
        aria-hidden={!showLiveCamera}
      >
        <div className={`booth__viewport ${phase === 'flash' ? 'is-flash' : ''}`}>
          <video ref={videoRef} className="booth__video" playsInline muted autoPlay />
          {showLiveCamera ? (
            <>
              <div className="booth__frame" aria-hidden />

              {phase === 'boot' ? (
                <div className="booth__overlay">
                  <p>Warming up the camera…</p>
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
            </>
          ) : null}
        </div>
      </div>

      {showLiveCamera ? (
        <div className="booth__stage">
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
            <div className="booth__ready-actions">
              <button
                type="button"
                className="booth__change-design"
                onClick={() => setPhase('pick-design')}
              >
                Change design
              </button>
              <button
                type="button"
                className="btn btn--primary booth__start"
                onClick={() => void startSession()}
              >
                Start booth
              </button>
            </div>
          ) : null}

          {phase === 'countdown' || phase === 'flash' ? (
            <p className="booth__hint">
              Hold still — {selectedDesign?.label.toLowerCase()} magic incoming
            </p>
          ) : null}
        </div>
      ) : null}
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
