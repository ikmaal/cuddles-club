import { useCallback, useEffect, useRef, useState } from 'react'
import { BackIcon } from '../components/Icons'
import { GuessMap } from '../components/sgGuess/GuessMap'
import { StreetViewPanorama } from '../components/sgGuess/StreetViewPanorama'
import { useCouple } from '../context/CoupleContext'
import { useOverscrollGuard } from '../hooks/useOverscrollGuard'
import { useSgGuessDuel } from '../hooks/useSgGuessDuel'
import { slotSubmitted } from '../lib/sgGuessDuel'
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
  const { coupleId, slot, profile } = useCouple()

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
  const duelTimedOutRef = useRef(false)

  const duelCtl = useSgGuessDuel(coupleId, slot, Boolean(mapsApi))

  const totalScore = roundResults.reduce((sum, row) => sum + row.score, 0)

  const inDuel = duelCtl.duelView === 'lobby' || duelCtl.duelView === 'play'
  const activePhase = inDuel ? duelCtl.duelPhase : phase

  const myDuelScore =
    duelCtl.duel && slot
      ? slot === 'a'
        ? duelCtl.duel.score_a
        : duelCtl.duel.score_b
      : 0
  const rivalDuelScore =
    duelCtl.duel && slot
      ? slot === 'a'
        ? duelCtl.duel.score_b
        : duelCtl.duel.score_a
      : 0

  const duelRoundLocation = duelCtl.duelLocation
  const duelRoundIndex = duelCtl.duel?.round_index ?? 0
  const partnerReady =
    duelCtl.duel && slot
      ? slot === 'a'
        ? duelCtl.duel.ready_b
        : duelCtl.duel.ready_a
      : false
  const iAmReady = duelCtl.duel && slot ? (slot === 'a' ? duelCtl.duel.ready_a : duelCtl.duel.ready_b) : false

  const prepareMaps = useCallback(async () => {
    setLoadError(null)
    try {
      const g = await loadGoogleMaps()
      mapsRef.current = g.maps
      setMapsApi(g.maps)
      duelCtl.bindMaps(g.maps)
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
  }, [duelCtl])

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

  // Duel: auto-submit when timer ends
  useEffect(() => {
    if (duelCtl.duelPhase !== 'explore' && duelCtl.duelPhase !== 'guess') return
    if (!duelCtl.duel || !slot) return
    const left = duelCtl.secondsLeft
    if (left > 0) return
    if (duelTimedOutRef.current) return
  if (slotSubmitted(duelCtl.duel, slot)) return
    duelTimedOutRef.current = true
    void duelCtl.postGuess(guess)
  }, [duelCtl, guess, slot])

  useEffect(() => {
    if (duelCtl.duel?.status !== 'playing') {
      duelTimedOutRef.current = false
    }
  }, [duelCtl.duel?.status, duelCtl.duel?.round_index])

  useEffect(() => {
    if (!inDuel || duelCtl.duel?.status !== 'playing') return
    setGuess(null)
    duelCtl.setMapSubview('explore')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset pin each synced round only
  }, [inDuel, duelCtl.duel?.round_index])

  useEffect(() => {
    if (inDuel && duelCtl.duelView === 'play' && hasApiKey && !mapsApi) {
      void prepareMaps()
    }
  }, [duelCtl.duelView, hasApiKey, inDuel, mapsApi, prepareMaps])

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
        <button
          type="button"
          className="sg-guess__back"
          onClick={() => {
            if (inDuel) void duelCtl.leaveDuel()
            else onBack()
          }}
          aria-label="Back"
        >
          <BackIcon size={18} />
        </button>
        <div className="sg-guess__brand">
          <p className="sg-guess__eyebrow">Singapore only</p>
          <h1 className="sg-guess__title">SG Guess</h1>
        </div>
        {activePhase !== 'menu' && activePhase !== 'summary' && activePhase !== 'duel-lobby' ? (
          <div className="sg-guess__round-pill" aria-live="polite">
            Round {Math.min((inDuel ? duelRoundIndex : roundIndex) + 1, SG_GUESS_ROUND_COUNT)}/
            {SG_GUESS_ROUND_COUNT}
          </div>
        ) : (
          <span className="sg-guess__round-pill sg-guess__round-pill--ghost" aria-hidden />
        )}
      </header>

      {activePhase === 'menu' ? (
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

          {duelCtl.enabled ? (
            <div className="sg-guess__duel-card">
              <h2 className="sg-guess__duel-title">Live 1v1 duel</h2>
              <p className="sg-guess__duel-copy">
                Same Street View, same timer — you and {profile.namePartner} guess on your own phones.
                Sign in on both devices (Us tab).
              </p>
              {duelCtl.duel && duelCtl.duel.status === 'lobby' && !iAmReady ? (
                <button
                  type="button"
                  className="sg-guess__btn sg-guess__btn--accent"
                  disabled={duelCtl.duelBusy || !hasApiKey}
                  onClick={() => void duelCtl.joinLobby()}
                >
                  Join {profile.namePartner}&apos;s lobby
                </button>
              ) : (
                <button
                  type="button"
                  className="sg-guess__btn sg-guess__btn--accent"
                  disabled={duelCtl.duelBusy || !hasApiKey}
                  onClick={() => void duelCtl.enterLobby()}
                >
                  {duelCtl.duel?.status === 'lobby' ? 'Open duel lobby' : 'Start live duel'}
                </button>
              )}
            </div>
          ) : (
            <p className="sg-guess__duel-hint">
              Live duel needs Supabase + both of you signed in on the Us tab.
            </p>
          )}

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

          {duelCtl.duelError ? (
            <div className="sg-guess__notice sg-guess__notice--warn" role="alert">
              {duelCtl.duelError}
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

      {activePhase === 'duel-lobby' && duelCtl.duel && slot ? (
        <section className="sg-guess__menu sg-guess__duel-lobby">
          <div className="sg-guess__duel-card sg-guess__duel-card--lobby">
            <h2 className="sg-guess__duel-title">Duel lobby</h2>
            <p className="sg-guess__duel-copy">
              {duelCtl.isHost
                ? 'Start when you’re both ready — same rounds, synced timer.'
                : `Waiting for ${profile.namePartner} to start the match.`}
            </p>
            <ul className="sg-guess__duel-ready" aria-label="Player readiness">
              <li className={iAmReady ? 'is-ready' : ''}>
                You {iAmReady ? '· ready' : '· not ready'}
              </li>
              <li className={partnerReady ? 'is-ready' : ''}>
                {profile.namePartner} {partnerReady ? '· ready' : '· not ready'}
              </li>
            </ul>
            <div className="sg-guess__menu-actions">
              {duelCtl.isHost ? (
                <button
                  type="button"
                  className="sg-guess__btn sg-guess__btn--primary"
                  disabled={!iAmReady || !partnerReady || duelCtl.duelBusy || !mapsApi}
                  onClick={() => void (prepareMaps().then(() => duelCtl.startMatch()))}
                >
                  Start duel
                </button>
              ) : null}
              <button
                type="button"
                className="sg-guess__btn sg-guess__btn--ghost"
                onClick={() => void duelCtl.leaveDuel()}
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {activePhase === 'loading' || phase === 'loading' ? (
        <div className="sg-guess__loading">
          <span className="sg-guess__spinner" aria-hidden />
          <p>
            {inDuel && !duelCtl.isHost
              ? `${profile.namePartner} is picking a Street View spot…`
              : 'Finding a Street View spot in Singapore…'}
          </p>
        </div>
      ) : null}

      {mapsApi &&
      ((roundLocation && (phase === 'explore' || phase === 'guess')) ||
        (inDuel && duelRoundLocation && (activePhase === 'explore' || activePhase === 'guess'))) ? (
        <div className="sg-guess__play">
          <div
            className={`sg-guess__street-wrap${(inDuel ? activePhase : phase) === 'guess' ? ' is-dimmed' : ''}`}
          >
            <StreetViewPanorama
              key={`${inDuel ? duelRoundIndex : roundIndex}-${
                (inDuel ? duelRoundLocation : roundLocation)!.panoId ??
                `${(inDuel ? duelRoundLocation : roundLocation)!.lat},${(inDuel ? duelRoundLocation : roundLocation)!.lng}`
              }`}
              maps={mapsApi}
              location={(inDuel ? duelRoundLocation : roundLocation)!}
              interactive={(inDuel ? activePhase : phase) === 'explore'}
            />
          </div>

          {(inDuel ? activePhase : phase) === 'guess' ? (
            <div className="sg-guess__guess-sheet">
              <div className="sg-guess__sheet-head">
                <h2>Place your pin on the map</h2>
                <p>Tap on the Singapore map only. Max 5,000 points for a bullseye.</p>
                {inDuel && duelCtl.duel && slot ? (
                  <p className="sg-guess__partner-lock">
                    {slotSubmitted(duelCtl.duel, slot === 'a' ? 'b' : 'a')
                      ? `${profile.namePartner} locked in`
                      : `${profile.namePartner} is still guessing…`}
                  </p>
                ) : null}
              </div>
              <GuessMap mode="pick" guess={guess} answer={null} onPick={setGuess} />
              <div className="sg-guess__sheet-actions">
                <button
                  type="button"
                  className="sg-guess__btn sg-guess__btn--ghost"
                  onClick={() =>
                    inDuel ? duelCtl.setMapSubview('explore') : setPhase('explore')
                  }
                >
                  Back to Street View
                </button>
                <button
                  type="button"
                  className="sg-guess__btn sg-guess__btn--accent"
                  disabled={
                    !guess ||
                    Boolean(inDuel && slot && duelCtl.duel && slotSubmitted(duelCtl.duel, slot))
                  }
                  onClick={() => (inDuel ? void duelCtl.postGuess(guess) : submitGuess())}
                >
                  Guess!
                </button>
              </div>
            </div>
          ) : null}

          <footer className="sg-guess__hud">
            {inDuel ? (
              <div className="sg-guess__hud-duel">
                <span>
                  You <strong>{myDuelScore.toLocaleString()}</strong>
                </span>
                <span>
                  {profile.namePartner} <strong>{rivalDuelScore.toLocaleString()}</strong>
                </span>
              </div>
            ) : (
              <div className="sg-guess__hud-score">
                Score <strong>{totalScore.toLocaleString()}</strong>
              </div>
            )}
            <div
              className={`sg-guess__hud-timer${(inDuel ? duelCtl.secondsLeft : timeLeft) <= 30 ? ' is-urgent' : ''}`}
            >
              {formatClock(inDuel ? duelCtl.secondsLeft : timeLeft)}
            </div>
            {(inDuel ? activePhase : phase) === 'explore' ? (
              <button
                type="button"
                className="sg-guess__btn sg-guess__btn--guess"
                onClick={() =>
                  inDuel ? duelCtl.setMapSubview('guess') : setPhase('guess')
                }
              >
                Guess
              </button>
            ) : (
              <span className="sg-guess__hud-spacer" aria-hidden />
            )}
          </footer>
        </div>
      ) : null}

      {inDuel && activePhase === 'reveal' && duelCtl.duel?.last_round && slot ? (
        <div className="sg-guess__reveal">
          {(() => {
            const lr = duelCtl.duel!.last_round!
            const mine = slot === 'a' ? lr.a : lr.b
            const rival = slot === 'a' ? lr.b : lr.a
            return (
              <>
                <div className="sg-guess__reveal-scores sg-guess__reveal-scores--duel">
                  <div>
                    <p className="sg-guess__reveal-points">{mine.score.toLocaleString()} pts</p>
                    <p className="sg-guess__reveal-label">You</p>
                    <p className="sg-guess__reveal-distance">
                      {Number.isFinite(mine.distanceM) ? formatDistance(mine.distanceM) : 'No guess'}
                    </p>
                  </div>
                  <span className="sg-guess__reveal-vs" aria-hidden>
                    vs
                  </span>
                  <div>
                    <p className="sg-guess__reveal-points">{rival.score.toLocaleString()} pts</p>
                    <p className="sg-guess__reveal-label">{profile.namePartner}</p>
                    <p className="sg-guess__reveal-distance">
                      {Number.isFinite(rival.distanceM) ? formatDistance(rival.distanceM) : 'No guess'}
                    </p>
                  </div>
                </div>
                <GuessMap
                  mode="reveal"
                  guess={mine.guess}
                  rivalGuess={rival.guess}
                  answer={lr.answer}
                />
              </>
            )
          })()}
          <div className="sg-guess__reveal-actions">
            {duelCtl.isHost ? (
              <button
                type="button"
                className="sg-guess__btn sg-guess__btn--primary"
                disabled={duelCtl.duelBusy}
                onClick={() => void duelCtl.advanceRound()}
              >
                {duelRoundIndex + 1 >= SG_GUESS_ROUND_COUNT ? 'See final scores' : 'Next round'}
              </button>
            ) : (
              <p className="sg-guess__reveal-wait">Waiting for host to continue…</p>
            )}
          </div>
        </div>
      ) : null}

      {!inDuel && phase === 'reveal' && lastReveal ? (
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

      {inDuel && activePhase === 'summary' && duelCtl.duel && slot ? (
        <section className="sg-guess__summary">
          <p className="sg-guess__summary-label">Duel complete</p>
          <p className="sg-guess__summary-score">
            {myDuelScore.toLocaleString()} — {rivalDuelScore.toLocaleString()}
          </p>
          <p className="sg-guess__summary-sub">
            {myDuelScore === rivalDuelScore
              ? 'Perfectly matched — rematch?'
              : myDuelScore > rivalDuelScore
                ? `You beat ${profile.namePartner} this round!`
                : `${profile.namePartner} takes the crown.`}
          </p>
          <div className="sg-guess__menu-actions">
            <button
              type="button"
              className="sg-guess__btn sg-guess__btn--primary"
              onClick={() => void duelCtl.leaveDuel()}
            >
              Back to menu
            </button>
            <button type="button" className="sg-guess__btn sg-guess__btn--ghost" onClick={onBack}>
              Back home
            </button>
          </div>
        </section>
      ) : null}

      {!inDuel && phase === 'summary' ? (
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