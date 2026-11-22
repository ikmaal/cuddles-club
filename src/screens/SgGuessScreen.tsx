import { useCallback, useEffect, useRef, useState } from 'react'
import { BackIcon } from '../components/Icons'
import { GuessMap } from '../components/sgGuess/GuessMap'
import { StreetViewPanorama } from '../components/sgGuess/StreetViewPanorama'
import { useOverscrollGuard } from '../hooks/useOverscrollGuard'
import {
  distanceMeters,
  formatDistance,
  scoreFromDistance,
  type LatLng,
} from '../lib/geoguessrMath'
import { googleMapsApiKey, loadGoogleMaps } from '../lib/googleMapsLoader'
import {
  findSingaporeStreetViewRound,
  SG_GUESS_ROUND_COUNT,
  SG_GUESS_ROUND_SECONDS,
  type StreetViewRoundLocation,
} from '../lib/singaporeGeoguess'
import './SgGuessScreen.css'

type GamePhase = 'menu' | 'loading' | 'explore' | 'guess' | 'reveal' | 'summary'

type RoundResult = {
  guess: LatLng | null
  answer: LatLng
  distanceM: number
  score: number
}

const BEST_SCORE_KEY = 'sg-guess-best-score'

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function readBestScore(): number {
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY)
    if (!raw) return 0
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

function writeBestScore(score: number): void {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score))
  } catch {
    /* storage blocked */
  }
}

interface SgGuessScreenProps {
  onBack: () => void
}

export function SgGuessScreen({ onBack }: SgGuessScreenProps) {
  const screenRef = useOverscrollGuard<HTMLDivElement>(false)
  const hasApiKey = Boolean(googleMapsApiKey())

  const [phase, setPhase] = useState<GamePhase>('menu')
  const [mapsApi, setMapsApi] = useState<typeof google.maps | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [roundIndex, setRoundIndex] = useState(0)
  const [roundLocation, setRoundLocation] = useState<StreetViewRoundLocation | null>(null)
  const [guess, setGuess] = useState<LatLng | null>(null)
  const [timeLeft, setTimeLeft] = useState(SG_GUESS_ROUND_SECONDS)
  const [roundResults, setRoundResults] = useState<RoundResult[]>([])
  const [lastReveal, setLastReveal] = useState<RoundResult | null>(null)
  const [bestScore, setBestScore] = useState(() => readBestScore())

  const mapsRef = useRef<typeof google.maps | null>(null)
  const startingRef = useRef(false)
  const timedOutRef = useRef(false)
  const submittedRoundRef = useRef(false)

  const totalScore = roundResults.reduce((sum, row) => sum + row.score, 0)

  const prepareMaps = useCallback(async () => {
    setLoadError(null)
    try {
      const g = await loadGoogleMaps()
      mapsRef.current = g.maps
      setMapsApi(g.maps)
      return g.maps
    } catch (error) {
      const message =
        error instanceof Error && error.message === 'MISSING_API_KEY'
          ? 'Add VITE_GOOGLE_MAPS_API_KEY to your .env (Maps JavaScript API + billing).'
          : 'Could not load Google Maps. Check your API key and enabled APIs.'
      setLoadError(message)
      setPhase('menu')
      return null
    }
  }, [])

  const loadRound = useCallback(async (maps: typeof google.maps, index: number) => {
    setPhase('loading')
    setGuess(null)
    setTimeLeft(SG_GUESS_ROUND_SECONDS)
    setLastReveal(null)
    timedOutRef.current = false
    submittedRoundRef.current = false

    try {
      const location = await findSingaporeStreetViewRound(maps)
      setRoundLocation(location)
      setRoundIndex(index)
      setPhase('explore')
    } catch {
      setLoadError('No Street View coverage found this round. Try again.')
      setPhase('menu')
    }
  }, [])

  const startGame = useCallback(async () => {
    if (startingRef.current) return
    startingRef.current = true
    setRoundResults([])
    setLoadError(null)

    const maps = mapsApi ?? (await prepareMaps())
    startingRef.current = false
    if (!maps) return

    await loadRound(maps, 0)
  }, [loadRound, mapsApi, prepareMaps])

  const submitGuess = useCallback(
    (forcedGuess?: LatLng | null) => {
      if (!roundLocation || phase === 'reveal' || phase === 'summary') return
      if (submittedRoundRef.current) return
      submittedRoundRef.current = true
      const finalGuess = forcedGuess !== undefined ? forcedGuess : guess
      const distanceM = finalGuess
        ? distanceMeters(finalGuess, roundLocation)
        : Number.POSITIVE_INFINITY
      const score = finalGuess ? scoreFromDistance(distanceM) : 0
      const result: RoundResult = {
        guess: finalGuess,
        answer: { lat: roundLocation.lat, lng: roundLocation.lng },
        distanceM,
        score,
      }
      setLastReveal(result)
      setRoundResults((prev) => [...prev, result])
      setPhase('reveal')
    },
    [guess, phase, roundLocation],
  )

  const nextRound = useCallback(async () => {
    const maps = mapsRef.current
    if (!maps) return

    const next = roundIndex + 1
    if (next >= SG_GUESS_ROUND_COUNT) {
      setPhase('summary')
      return
    }
    await loadRound(maps, next)
  }, [loadRound, roundIndex])

  useEffect(() => {
    if (phase !== 'explore' && phase !== 'guess') return
    if (timeLeft <= 0) {
      if (!timedOutRef.current) {
        timedOutRef.current = true
        submitGuess(guess)
      }
      return
    }
    const id = window.setInterval(() => {
      setTimeLeft((value) => value - 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [guess, phase, submitGuess, timeLeft])

  useEffect(() => {
    if (phase !== 'summary') return
    const merged = roundResults.reduce((sum, row) => sum + row.score, 0)
    setBestScore((prev) => {
      const nextBest = Math.max(prev, merged)
      if (nextBest > prev) writeBestScore(nextBest)
      return nextBest
    })
  }, [phase, roundResults])

  return (
    <div className="screen screen--sg-guess" ref={screenRef}>
      <header className="sg-guess__top">
        <button type="button" className="sg-guess__back" onClick={onBack} aria-label="Back">
          <BackIcon size={18} />
        </button>
        <div className="sg-guess__brand">
          <p className="sg-guess__eyebrow">Singapore only</p>
          <h1 className="sg-guess__title">SG Guess</h1>
        </div>
        {phase !== 'menu' && phase !== 'summary' ? (
          <div className="sg-guess__round-pill" aria-live="polite">
            Round {Math.min(roundIndex + 1, SG_GUESS_ROUND_COUNT)}/{SG_GUESS_ROUND_COUNT}
          </div>
        ) : (
          <span className="sg-guess__round-pill sg-guess__round-pill--ghost" aria-hidden />
        )}
      </header>

      {phase === 'menu' ? (
        <section className="sg-guess__menu">
          <div className="sg-guess__hero">
            <p className="sg-guess__tagline">
              Explore real Google Street View across Singapore, then drop your pin on the map.
            </p>
            <ul className="sg-guess__feature-list">
              <li>5 rounds · 3 minutes each</li>
              <li>Official-style 0–5,000 distance scoring</li>
              <li>Outdoor coverage · Singapore boundary only</li>
            </ul>
          </div>

          {!hasApiKey ? (
            <div className="sg-guess__notice sg-guess__notice--warn" role="alert">
              <strong>Google Maps API key required</strong>
              <p>
                Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to your <code>.env</code>. Enable the{' '}
                <strong>Maps JavaScript API</strong> in Google Cloud (Street View uses the same
                key).
              </p>
            </div>
          ) : null}

          {loadError ? (
            <div className="sg-guess__notice sg-guess__notice--warn" role="alert">
              {loadError}
            </div>
          ) : null}

          <div className="sg-guess__menu-actions">
            <button
              type="button"
              className="sg-guess__btn sg-guess__btn--primary"
              disabled={!hasApiKey}
              onClick={() => void startGame()}
            >
              Play classic game
            </button>
            {bestScore > 0 ? (
              <p className="sg-guess__best">
                Personal best: <strong>{bestScore.toLocaleString()}</strong> pts
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {phase === 'loading' ? (
        <div className="sg-guess__loading">
          <span className="sg-guess__spinner" aria-hidden />
          <p>Finding a Street View spot in Singapore…</p>
        </div>
      ) : null}

      {mapsApi && roundLocation && (phase === 'explore' || phase === 'guess') ? (
        <div className="sg-guess__play">
          <div className={`sg-guess__street-wrap${phase === 'guess' ? ' is-dimmed' : ''}`}>
            <StreetViewPanorama
              key={`${roundIndex}-${roundLocation.panoId ?? `${roundLocation.lat},${roundLocation.lng}`}`}
              maps={mapsApi}
              location={roundLocation}
              interactive={phase === 'explore'}
            />
          </div>

          {phase === 'guess' ? (
            <div className="sg-guess__guess-sheet">
              <div className="sg-guess__sheet-head">
                <h2>Place your pin on the map</h2>
                <p>Tap on the Singapore map only. Max 5,000 points for a bullseye.</p>
              </div>
              <GuessMap mode="pick" guess={guess} answer={null} onPick={setGuess} />
              <div className="sg-guess__sheet-actions">
                <button
                  type="button"
                  className="sg-guess__btn sg-guess__btn--ghost"
                  onClick={() => setPhase('explore')}
                >
                  Back to Street View
                </button>
                <button
                  type="button"
                  className="sg-guess__btn sg-guess__btn--accent"
                  disabled={!guess}
                  onClick={() => submitGuess()}
                >
                  Guess!
                </button>
              </div>
            </div>
          ) : null}

          <footer className="sg-guess__hud">
            <div className="sg-guess__hud-score">
              Score <strong>{totalScore.toLocaleString()}</strong>
            </div>
            <div className={`sg-guess__hud-timer${timeLeft <= 30 ? ' is-urgent' : ''}`}>
              {formatClock(timeLeft)}
            </div>
            {phase === 'explore' ? (
              <button
                type="button"
                className="sg-guess__btn sg-guess__btn--guess"
                onClick={() => setPhase('guess')}
              >
                Guess
              </button>
            ) : (
              <span className="sg-guess__hud-spacer" aria-hidden />
            )}
          </footer>
        </div>
      ) : null}

      {phase === 'reveal' && lastReveal ? (
        <div className="sg-guess__reveal">
          <div className="sg-guess__reveal-scores">
            <p className="sg-guess__reveal-points">{lastReveal.score.toLocaleString()} pts</p>
            <p className="sg-guess__reveal-distance">
              {Number.isFinite(lastReveal.distanceM)
                ? formatDistance(lastReveal.distanceM)
                : 'No guess'}{' '}
              away
            </p>
          </div>
          <GuessMap mode="reveal" guess={lastReveal.guess} answer={lastReveal.answer} />
          <div className="sg-guess__reveal-actions">
            <button
              type="button"
              className="sg-guess__btn sg-guess__btn--primary"
              onClick={() => void nextRound()}
            >
              {roundIndex + 1 >= SG_GUESS_ROUND_COUNT ? 'See final score' : 'Next round'}
            </button>
          </div>
        </div>
      ) : null}

      {phase === 'summary' ? (
        <section className="sg-guess__summary">
          <p className="sg-guess__summary-label">Game complete</p>
          <p className="sg-guess__summary-score">{totalScore.toLocaleString()}</p>
          <p className="sg-guess__summary-sub">
            {totalScore >= 20_000
              ? 'Cartographer-tier instincts.'
              : totalScore >= 12_000
                ? 'Solid Singapore sense.'
                : 'Keep exploring — the MRT helps next time.'}
          </p>
          <ul className="sg-guess__round-table" aria-label="Round breakdown">
            {roundResults.map((row, index) => (
              <li key={`round-${index}`} className="sg-guess__round-row">
                R{index + 1} · {row.score.toLocaleString()} pts ·{' '}
                {Number.isFinite(row.distanceM) ? formatDistance(row.distanceM) : '—'}
              </li>
            ))}
          </ul>
          <div className="sg-guess__menu-actions">
            <button type="button" className="sg-guess__btn sg-guess__btn--primary" onClick={() => void startGame()}>
              Play again
            </button>
            <button type="button" className="sg-guess__btn sg-guess__btn--ghost" onClick={onBack}>
              Back home
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}