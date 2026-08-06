import { useEffect, useState } from 'react'

interface SplashIntroProps {
  onDone: () => void
}

const SPLASH_MS = 2200
const EXIT_MS = 480

export function SplashIntro({ onDone }: SplashIntroProps) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hold = reduceMotion ? 500 : SPLASH_MS
    const exit = reduceMotion ? 100 : EXIT_MS

    const exitTimer = window.setTimeout(() => setExiting(true), hold)
    const doneTimer = window.setTimeout(() => onDone(), hold + exit)

    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      className={`splash ${exiting ? 'is-exiting' : ''}`}
      role="status"
      aria-live="polite"
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
