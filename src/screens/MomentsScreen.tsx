import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { PolaroidCamera } from '../components/PolaroidCamera'
import { ScreenHeader } from '../components/ScreenHeader'
import { ScrollRegion } from '../components/ScrollRegion'
import { CameraIcon, TrashIcon } from '../components/Icons'
import type { Moment } from '../types'

const MOMENTS_PIN = '002927'
const PIN_LENGTH = MOMENTS_PIN.length
const UNLOCK_KEY = 'cuddles-moments-unlocked'

interface MomentsScreenProps {
  moments: Moment[]
  ready: boolean
  busy: boolean
  error: string
  onAdd: (image: string, caption: string) => Promise<boolean>
  onRemove: (id: string) => Promise<boolean>
  onClearError: () => void
  onBack: () => void
}

function readUnlocked() {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === '1'
  } catch {
    return false
  }
}

export function MomentsScreen({
  moments,
  ready,
  busy,
  error,
  onAdd,
  onRemove,
  onClearError,
  onBack,
}: MomentsScreenProps) {
  const [unlocked, setUnlocked] = useState(readUnlocked)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [viewer, setViewer] = useState<Moment | null>(null)

  useEffect(() => {
    if (!cameraOpen && !viewer) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [cameraOpen, viewer])

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return
    if (pin === MOMENTS_PIN) {
      try {
        sessionStorage.setItem(UNLOCK_KEY, '1')
      } catch {
        /* ignore */
      }
      setUnlocked(true)
      setPin('')
      setPinError(false)
      return
    }
    setPinError(true)
    const timer = window.setTimeout(() => {
      setPin('')
      setPinError(false)
    }, 420)
    return () => window.clearTimeout(timer)
  }, [pin])

  function pressDigit(digit: string) {
    if (pin.length >= PIN_LENGTH) return
    setPinError(false)
    setPin((current) => current + digit)
  }

  function deleteDigit() {
    setPinError(false)
    setPin((current) => current.slice(0, -1))
  }

  async function removeViewer() {
    if (!viewer) return
    if (!window.confirm('Delete this polaroid?')) return
    const ok = await onRemove(viewer.id)
    if (ok) setViewer(null)
  }

  if (!unlocked) {
    return (
      <div className="screen screen--moments">
        <ScreenHeader title="Moments" subtitle="Private album" onBack={onBack} />

        <ScrollRegion className="screen__scroll moments-scroll">
          <div className="moments-pin">
            <p className="moments-pin__wip">Work in progress</p>
            <h2 className="moments-pin__title">Enter PIN</h2>
            <p className="moments-pin__hint">Only people with the code can open Moments.</p>

            <div
              className={`moments-pin__dots${pinError ? ' is-error' : ''}`}
              aria-label={`${pin.length} of ${PIN_LENGTH} digits entered`}
            >
              {Array.from({ length: PIN_LENGTH }, (_, index) => (
                <span
                  key={index}
                  className={`moments-pin__dot${index < pin.length ? ' is-filled' : ''}`}
                />
              ))}
            </div>

            {pinError ? (
              <p className="moments-pin__error" role="alert">
                Wrong PIN. Try again.
              </p>
            ) : (
              <p className="moments-pin__spacer" aria-hidden />
            )}

            <div className="moments-pin__pad" role="group" aria-label="PIN keypad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key) => {
                if (key === '') {
                  return <span key="spacer" className="moments-pin__key moments-pin__key--empty" />
                }
                if (key === '⌫') {
                  return (
                    <button
                      key="backspace"
                      type="button"
                      className="moments-pin__key moments-pin__key--action"
                      onClick={deleteDigit}
                      aria-label="Delete last digit"
                    >
                      ⌫
                    </button>
                  )
                }
                return (
                  <button
                    key={key}
                    type="button"
                    className="moments-pin__key"
                    onClick={() => pressDigit(key)}
                  >
                    {key}
                  </button>
                )
              })}
            </div>
          </div>
        </ScrollRegion>
      </div>
    )
  }

  return (
    <div className="screen screen--moments">
      <ScreenHeader
        title="Moments"
        subtitle={
          ready
            ? moments.length === 0
              ? 'Your polaroid album'
              : `${moments.length} ${moments.length === 1 ? 'print' : 'prints'}`
            : 'Loading…'
        }
        onBack={onBack}
        action={
          <button
            type="button"
            className="moments-capture-btn"
            onClick={() => {
              onClearError()
              setCameraOpen(true)
            }}
            aria-label="Take a polaroid"
          >
            <CameraIcon size={20} />
          </button>
        }
      />

      <ScrollRegion className="screen__scroll moments-scroll">
        {error ? (
          <p className="moments-error" role="alert">
            {error}
          </p>
        ) : null}

        {!ready ? (
          <p className="moments-empty">Loading your prints…</p>
        ) : moments.length === 0 ? (
          <div className="moments-empty-card">
            <div className="polaroid-print polaroid-print--empty" aria-hidden>
              <div className="polaroid-print__photo" />
              <p>New moment</p>
            </div>
            <h2>No prints yet</h2>
            <p>Snap a polaroid and it will land in this album.</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                onClearError()
                setCameraOpen(true)
              }}
            >
              Take a polaroid
            </button>
          </div>
        ) : (
          <ul className="moments-grid" aria-label="Polaroid gallery">
            {moments.map((moment, index) => (
              <li key={moment.id}>
                <button
                  type="button"
                  className={`moments-card moments-card--tilt-${(index % 3) + 1}`}
                  onClick={() => setViewer(moment)}
                >
                  <span className="polaroid-print">
                    <img src={moment.image} alt={moment.caption || 'Polaroid moment'} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollRegion>

      {cameraOpen
        ? createPortal(
            <PolaroidCamera
              busy={busy}
              onSave={onAdd}
              onClose={() => setCameraOpen(false)}
            />,
            document.body,
          )
        : null}

      {viewer
        ? createPortal(
            <div
              className="moments-viewer"
              role="dialog"
              aria-modal="true"
              aria-label="Polaroid viewer"
              onClick={(event) => {
                if (event.target === event.currentTarget) setViewer(null)
              }}
            >
              <div className="moments-viewer__panel">
                <header className="moments-viewer__header">
                  <button
                    type="button"
                    className="polaroid-cam__text-btn"
                    onClick={() => setViewer(null)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="moments-viewer__delete"
                    onClick={() => void removeViewer()}
                    disabled={busy}
                    aria-label="Delete polaroid"
                  >
                    <TrashIcon size={18} />
                  </button>
                </header>
                <div className="polaroid-print polaroid-print--viewer">
                  <img src={viewer.image} alt={viewer.caption || 'Polaroid moment'} />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
