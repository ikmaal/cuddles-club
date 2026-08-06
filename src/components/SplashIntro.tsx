import { useEffect, useRef, useState } from 'react'

interface SplashIntroProps {
  /** When false, splash stays up even after the animation finishes. */
  canFinish: boolean
  onDone: () => void
}

const SPLASH_MS = 2200
const EXIT_MS = 480

export function SplashIntro({ canFinish, onDone }: SplashIntroProps) {
  const [exiting, setExiting] = useState(false)
  const [holdDone, setHoldDone] = useState(false)
  const finishedRef = useRef(false)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hold = reduceMotion ? 500 : SPLASH_MS
    const timer = window.setTimeout(() => setHoldDone(true), hold)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!holdDone || !canFinish || finishedRef.current) return

    finishedRef.current = true
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const exit = reduceMotion ? 100 : EXIT_MS

    setExiting(true)
    const doneTimer = window.setTimeout(() => onDone(), exit)
    return () => window.clearTimeout(doneTimer)
  }, [holdDone, canFinish, onDone])

  return (
    <div
      className={`splash ${exiting ? 'is-exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy={!canFinish || !holdDone}
      aria-label="Welcome to Cuddles Club"
    >
      <div className="splash__sparkles" aria-hidden>
        <span className="splash__spark splash__spark--1" />
        <span className="splash__spark splash__spark--2" />
        <span className="splash__spark splash__spark--3" />
        <span className="splash__spark splash__spark--4" />
        <span className="splash__spark splash__spark--5" />
        <span className="splash__spark splash__spark--6" />
      </div>

      <div className="splash__stage">
        <div className="splash__frame">
          <img
            className="splash__mark"
            src={`${import.meta.env.BASE_URL}favicon.jpg`}
            alt=""
            width={96}
            height={96}
          />
          <span className="splash__shutter" aria-hidden />
        </div>
      </div>
    </div>
  )
}
