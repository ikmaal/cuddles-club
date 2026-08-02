import { useRef, useState } from 'react'
import type { CareResult } from '../hooks/useCat'
import type { CatMood, CatState, Carer, CoupleProfile } from '../types'
import { XP_PER_LEVEL } from '../types'
import { Cat, type CatPhase } from './Cat'

interface CatHomeProps {
  cat: CatState
  mood: CatMood
  level: number
  profile: CoupleProfile
  onFeed: () => CareResult
  onGroom: () => CareResult
  onPet: () => CareResult
  onToggleSleep: () => CareResult
  onPlay: () => void
  onSetCarer: (carer: Carer) => void
  onRename: (name: string) => void
  onNotify: (message: string) => void
}

interface Heart {
  id: number
  left: number
  drift: number
}

export const MOOD_COPY: Record<CatMood, string> = {
  happy: 'is purring like a tiny engine',
  content: 'is chilling with the two of you',
  hungry: 'keeps staring at the empty bowl',
  sleepy: 'can barely keep both eyes open',
  messy: 'rolled in something questionable',
  sad: 'would really like some attention',
  sleeping: 'is dreaming about tuna',
}

function statTone(value: number): string {
  if (value >= 60) return 'good'
  if (value >= 30) return 'warn'
  return 'low'
}

export function CatHome({
  cat,
  mood,
  level,
  profile,
  onFeed,
  onGroom,
  onPet,
  onToggleSleep,
  onPlay,
  onSetCarer,
  onRename,
  onNotify,
}: CatHomeProps) {
  const [phase, setPhase] = useState<CatPhase>('idle')
  const [hearts, setHearts] = useState<Heart[]>([])
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(cat.name)
  const heartId = useRef(0)
  const phaseTimer = useRef<number | null>(null)

  const carerName =
    cat.activeCarer === 'you' ? profile.nameYou : profile.namePartner

  function runPhase(next: CatPhase, ms: number) {
    if (phaseTimer.current) window.clearTimeout(phaseTimer.current)
    setPhase(next)
    phaseTimer.current = window.setTimeout(() => setPhase('idle'), ms)
  }

  function report(result: CareResult) {
    if (!result.message) return
    onNotify(
      result.gainedXp > 0
        ? `${result.message} · +${result.gainedXp} XP`
        : result.message,
    )
  }

  function handleFeed() {
    const result = onFeed()
    if (result.gainedXp > 0) runPhase('eating', 1800)
    report(result)
  }

  function handleGroom() {
    const result = onGroom()
    if (result.gainedXp > 0) runPhase('grooming', 1600)
    report(result)
  }

  function handlePet() {
    const result = onPet()
    runPhase('petting', 900)

    const id = heartId.current++
    setHearts((prev) => [
      ...prev,
      { id, left: 38 + Math.random() * 24, drift: Math.random() * 40 - 20 },
    ])
    window.setTimeout(() => {
      setHearts((prev) => prev.filter((heart) => heart.id !== id))
    }, 1100)

    report(result)
  }

  function handleSleep() {
    report(onToggleSleep())
  }

  function commitName() {
    onRename(draftName)
    setEditingName(false)
  }

  const xpInLevel = cat.xp % XP_PER_LEVEL
  const totalCare = cat.careYou + cat.carePartner

  const stats = [
    { key: 'fullness', label: 'Fed', value: cat.fullness },
    { key: 'happiness', label: 'Happy', value: cat.happiness },
    { key: 'energy', label: 'Energy', value: cat.energy },
    { key: 'cleanliness', label: 'Clean', value: cat.cleanliness },
  ]

  return (
    <div className="cat-home">
      <div className="cat-home__scroll">
        <div className="cat-stage">
          <div className="cat-stage__sky" aria-hidden />
          <div className="cat-stage__rug" aria-hidden />

          <button
            type="button"
            className="cat-stage__tap"
            onClick={handlePet}
            aria-label={`Pet ${cat.name}`}
          >
            <Cat mood={mood} phase={phase} />
          </button>

          {hearts.map((heart) => (
            <span
              key={heart.id}
              className="cat-heart"
              style={{
                left: `${heart.left}%`,
                ['--drift' as string]: `${heart.drift}px`,
              }}
              aria-hidden
            >
              ♥
            </span>
          ))}
        </div>

        <div className="cat-status">
          {editingName ? (
            <form
              className="cat-status__rename"
              onSubmit={(e) => {
                e.preventDefault()
                commitName()
              }}
            >
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                maxLength={18}
                aria-label="Cat name"
                autoFocus
                onBlur={commitName}
              />
              <button type="submit" className="btn btn--secondary btn--tiny">
                Save
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="cat-status__name"
              onClick={() => {
                setDraftName(cat.name)
                setEditingName(true)
              }}
            >
              {cat.name}
              <span className="cat-status__pencil" aria-hidden>
                ✎
              </span>
            </button>
          )}

          <p className="cat-status__mood">
            {cat.name} {MOOD_COPY[mood]}
          </p>

          <div className="bond">
            <div className="bond__top">
              <span>Bond level {level}</span>
              <span>
                {xpInLevel}/{XP_PER_LEVEL} XP
              </span>
            </div>
            <div className="bond__track">
              <div
                className="bond__fill"
                style={{ width: `${(xpInLevel / XP_PER_LEVEL) * 100}%` }}
              />
            </div>
            <p className="bond__meta">
              {totalCare === 1
                ? '1 care moment together'
                : `${totalCare} care moments together`}
              {cat.bestScore > 0 ? ` · best chase ${cat.bestScore}` : ''}
            </p>
          </div>
        </div>

        <ul className="stat-grid">
          {stats.map((stat) => (
            <li key={stat.key} className={`stat stat--${statTone(stat.value)}`}>
              <div className="stat__top">
                <span>{stat.label}</span>
                <strong>{Math.round(stat.value)}%</strong>
              </div>
              <div className="stat__track">
                <div className="stat__fill" style={{ width: `${stat.value}%` }} />
              </div>
            </li>
          ))}
        </ul>

        <div className="carer-switch" role="group" aria-label="Who is caring right now">
          <span className="carer-switch__label">Caring as</span>
          <div className="carer-switch__options">
            <button
              type="button"
              className={`carer-chip ${cat.activeCarer === 'you' ? 'is-active' : ''}`}
              onClick={() => onSetCarer('you')}
              aria-pressed={cat.activeCarer === 'you'}
            >
              {profile.nameYou}
              <small>{cat.careYou}</small>
            </button>
            <button
              type="button"
              className={`carer-chip ${cat.activeCarer === 'partner' ? 'is-active' : ''}`}
              onClick={() => onSetCarer('partner')}
              aria-pressed={cat.activeCarer === 'partner'}
            >
              {profile.namePartner}
              <small>{cat.carePartner}</small>
            </button>
          </div>
        </div>

        <p className="cat-hint">
          {carerName} is on duty · tap {cat.name} for pets
        </p>

        <div className="care-actions">
          <button type="button" className="care-btn" onClick={handleFeed}>
            <span className="care-btn__icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                <path
                  d="M4 13h16a8 8 0 0 1-8 7 8 8 0 0 1-8-7z"
                  fill="currentColor"
                />
                <path
                  d="M7 10c0-2 2-3 5-3s5 1 5 3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            Feed
          </button>

          <button type="button" className="care-btn" onClick={onPlay}>
            <span className="care-btn__icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                <path
                  d="M18 4c-7 1-12 7-12 12l-2 4 4-2c5 0 11-5 12-12 0-1-1-2-2-2z"
                  fill="currentColor"
                />
              </svg>
            </span>
            Play
          </button>

          <button type="button" className="care-btn" onClick={handleGroom}>
            <span className="care-btn__icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                <rect x="4" y="4" width="16" height="8" rx="3" fill="currentColor" />
                <path
                  d="M7 13v5M11 13v5M15 13v5M19 13v4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            Brush
          </button>

          <button type="button" className="care-btn" onClick={handleSleep}>
            <span className="care-btn__icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                <path
                  d="M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10z"
                  fill="currentColor"
                />
              </svg>
            </span>
            {cat.sleeping ? 'Wake' : 'Nap'}
          </button>
        </div>
      </div>
    </div>
  )
}
