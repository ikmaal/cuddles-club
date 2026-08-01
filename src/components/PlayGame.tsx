import { useCallback, useEffect, useRef, useState } from 'react'
import { Cat } from './Cat'

const ROUND_MS = 25_000
const TICK_MS = 100

interface PlayGameProps {
  catName: string
  bestScore: number
  onClose: () => void
  onFinish: (score: number) => void
}

interface Pop {
  id: number
  x: number
  y: number
  value: number
}

type Stage = 'ready' | 'playing' | 'done'

function randomSpot() {
  return {
    x: 12 + Math.random() * 76,
    y: 14 + Math.random() * 62,
  }
}

export function PlayGame({
  catName,
  bestScore,
  onClose,
  onFinish,
}: PlayGameProps) {
  const [stage, setStage] = useState<Stage>('ready')
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [catches, setCatches] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_MS)
  const [spot, setSpot] = useState(randomSpot)
  const [pops, setPops] = useState<Pop[]>([])
  const popId = useRef(0)
  const moveTimer = useRef<number | null>(null)

  const scheduleMove = useCallback((currentCatches: number) => {
    if (moveTimer.current) window.clearTimeout(moveTimer.current)
    const delay = Math.max(620, 1500 - currentCatches * 45)
    moveTimer.current = window.setTimeout(() => {
      setSpot(randomSpot())
      scheduleMove(currentCatches)
    }, delay)
  }, [])

  useEffect(() => {
    return () => {
      if (moveTimer.current) window.clearTimeout(moveTimer.current)
    }
  }, [])

  useEffect(() => {
    if (stage !== 'playing') return

    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - TICK_MS
        if (next <= 0) {
          window.clearInterval(id)
          return 0
        }
        return next
      })
    }, TICK_MS)

    return () => window.clearInterval(id)
  }, [stage])

  useEffect(() => {
    if (stage === 'playing' && timeLeft <= 0) {
      if (moveTimer.current) window.clearTimeout(moveTimer.current)
      setStage('done')
    }
  }, [stage, timeLeft])

  function startRound() {
    setScore(0)
    setCombo(0)
    setBestCombo(0)
    setCatches(0)
    setTimeLeft(ROUND_MS)
    setSpot(randomSpot())
    setPops([])
    setStage('playing')
    scheduleMove(0)
  }

  function addPop(x: number, y: number, value: number) {
    const id = popId.current++
    setPops((prev) => [...prev, { id, x, y, value }])
    window.setTimeout(() => {
      setPops((prev) => prev.filter((pop) => pop.id !== id))
    }, 700)
  }

  function handleCatch(event: React.PointerEvent) {
    event.stopPropagation()
    if (stage !== 'playing') return

    const nextCombo = combo + 1
    const points = 1 + Math.floor(combo / 3)

    setCombo(nextCombo)
    setBestCombo((prev) => Math.max(prev, nextCombo))
    setScore((prev) => prev + points)
    setCatches((prev) => {
      const next = prev + 1
      scheduleMove(next)
      return next
    })
    addPop(spot.x, spot.y, points)
    setSpot(randomSpot())
  }

  function handleMiss() {
    if (stage !== 'playing') return
    setCombo(0)
  }

  const progress = (timeLeft / ROUND_MS) * 100
  const lookAt = { x: (spot.x - 50) / 42, y: (spot.y - 45) / 45 }

  return (
    <div className="sheet-backdrop sheet-backdrop--full" role="presentation">
      <div
        className="sheet sheet--full game"
        role="dialog"
        aria-modal="true"
        aria-labelledby="play-title"
      >
        <header className="sheet__header">
          <div>
            <p className="eyebrow">Playtime</p>
            <h2 id="play-title">Catch the feather</h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="game__hud">
          <div className="game__stat">
            <span>Score</span>
            <strong>{score}</strong>
          </div>
          <div className="game__stat">
            <span>Combo</span>
            <strong>{combo > 0 ? `×${combo}` : '—'}</strong>
          </div>
          <div className="game__stat">
            <span>Best</span>
            <strong>{Math.max(bestScore, score)}</strong>
          </div>
        </div>

        <div className="game__timer" aria-hidden>
          <div className="game__timer-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="game__area" onPointerDown={handleMiss}>
          {stage === 'playing' ? (
            <button
              type="button"
              className="feather"
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              onPointerDown={handleCatch}
              aria-label="Catch the feather"
            >
              <svg viewBox="0 0 40 40" width="44" height="44" aria-hidden>
                <path
                  d="M30 6C18 8 10 18 10 28l-4 6 6-4c10 0 20-8 22-20 0-2-2-4-4-4z"
                  fill="#F6C453"
                  stroke="#E0A93B"
                  strokeWidth="1.6"
                />
                <path
                  d="M28 10C20 14 14 22 12 30"
                  stroke="#E0A93B"
                  strokeWidth="1.6"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M24 10c2 4 2 8 0 12M18 16c2 3 2 6 0 9"
                  stroke="#FFE6A8"
                  strokeWidth="1.6"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}

          {pops.map((pop) => (
            <span
              key={pop.id}
              className="game__pop"
              style={{ left: `${pop.x}%`, top: `${pop.y}%` }}
            >
              +{pop.value}
            </span>
          ))}

          {stage === 'ready' ? (
            <div className="game__overlay">
              <h3>Ready?</h3>
              <p>
                Tap the feather as fast as you can. Keep a streak going for bonus
                points — {catName} loves a good chase.
              </p>
              <button type="button" className="btn btn--primary" onClick={startRound}>
                Start the chase
              </button>
            </div>
          ) : null}

          {stage === 'done' ? (
            <div className="game__overlay">
              <h3>{score >= bestScore && score > 0 ? 'New best!' : 'Good round!'}</h3>
              <p className="game__result">
                {score} {score === 1 ? 'point' : 'points'} · {catches}{' '}
                {catches === 1 ? 'catch' : 'catches'} · best streak ×{bestCombo}
              </p>
              <div className="game__overlay-actions">
                <button type="button" className="btn btn--ghost" onClick={startRound}>
                  Again
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => onFinish(score)}
                >
                  Give {catName} the win
                </button>
              </div>
            </div>
          ) : null}

          <div className="game__cat" aria-hidden>
            <Cat
              mood="happy"
              phase="petting"
              lookAt={stage === 'playing' ? lookAt : null}
              size={170}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
