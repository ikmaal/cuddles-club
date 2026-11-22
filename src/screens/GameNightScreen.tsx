import { useState } from 'react'
import { BackIcon, DiceIcon } from '../components/Icons'
import { useOverscrollGuard } from '../hooks/useOverscrollGuard'
import { SgGuessScreen } from './SgGuessScreen'
import './GameNightScreen.css'

type GameNightGame = 'sgguess'

interface GameNightScreenProps {
  onBack: () => void
}

const GAMES: {
  id: GameNightGame
  title: string
  subtitle: string
  description: string
  tag: string
  cover: string
  accent: string
  accentGlow: string
  chips: string[]
}[] = [
  {
    id: 'sgguess',
    title: 'SG Guess',
    subtitle: 'Street View detective',
    description: 'Drop into Singapore streets, pin the map, chase a perfect 5,000.',
    tag: 'Geo',
    cover: '/sgguessicon.svg',
    accent: '#3dd68c',
    accentGlow: 'rgba(61, 214, 140, 0.45)',
    chips: ['5 rounds', '3 min', 'Singapore'],
  },
]

export function GameNightScreen({ onBack }: GameNightScreenProps) {
  const screenRef = useOverscrollGuard<HTMLDivElement>(false)
  const [activeGame, setActiveGame] = useState<GameNightGame | null>(null)
  const [hovered, setHovered] = useState<GameNightGame | null>(null)

  if (activeGame === 'sgguess') {
    return <SgGuessScreen onBack={() => setActiveGame(null)} />
  }

  const featured = GAMES[0]

  return (
    <div className="screen screen--game-night" ref={screenRef}>
      <div className="game-night__ambient" aria-hidden>
        <span className="game-night__orb game-night__orb--a" />
        <span className="game-night__orb game-night__orb--b" />
        <span className="game-night__grid" />
      </div>

      <header className="game-night__top">
        <button type="button" className="game-night__back" onClick={onBack} aria-label="Back">
          <BackIcon size={18} />
        </button>
        <div className="game-night__top-title">
          <DiceIcon size={20} />
          <span>Game Night</span>
        </div>
        <span className="game-night__live-dot" title="Ready to play" aria-hidden />
      </header>

      <div className="game-night__scroll">
        <section className="game-night__hero">
          <div className="game-night__hero-art">
            <img
              className="game-night__hero-icon"
              src="/gamenight_icon.jpg"
              alt=""
              width={88}
              height={88}
              decoding="async"
            />
            <span className="game-night__hero-ring" />
          </div>
          <div className="game-night__hero-copy">
            <p className="game-night__kicker">Cuddles Club arcade</p>
            <h1 className="game-night__headline">
              <span className="game-night__headline-accent">Play</span> together
            </h1>
            <p className="game-night__hero-sub">
              Couch co-op vibes, bite-sized challenges, bragging rights included.
            </p>
          </div>
        </section>

        <section
          className="game-night__featured"
          style={
            {
              '--card-accent': featured.accent,
              '--card-glow': featured.accentGlow,
            } as React.CSSProperties
          }
        >
          <div className="game-night__section-head">
            <h2 className="game-night__section-title">Featured</h2>
            <span className="game-night__section-badge">{GAMES.length} live</span>
          </div>

          <button
            type="button"
            className={`game-night__featured-card${hovered === featured.id ? ' is-hovered' : ''}`}
            onClick={() => setActiveGame(featured.id)}
            onPointerEnter={() => setHovered(featured.id)}
            onPointerLeave={() => setHovered(null)}
          >
            <div className="game-night__featured-visual">
              <img src={featured.cover} alt="" className="game-night__featured-cover" decoding="async" />
              <span className="game-night__featured-tag">{featured.tag}</span>
            </div>
            <div className="game-night__featured-body">
              <p className="game-night__featured-eyebrow">{featured.subtitle}</p>
              <h3 className="game-night__featured-title">{featured.title}</h3>
              <p className="game-night__featured-desc">{featured.description}</p>
              <ul className="game-night__chips" aria-label="Game details">
                {featured.chips.map((chip) => (
                  <li key={chip}>{chip}</li>
                ))}
              </ul>
              <span className="game-night__play-btn">
                <span className="game-night__play-shine" aria-hidden />
                Play now
              </span>
            </div>
          </button>
        </section>

        <section className="game-night__shelf">
          <h2 className="game-night__section-title game-night__section-title--shelf">Coming soon</h2>
          <div className="game-night__soon-grid">
            <div className="game-night__soon-card" aria-hidden>
              <span className="game-night__soon-lock">?</span>
              <p className="game-night__soon-label">Next drop</p>
              <p className="game-night__soon-hint">More mini games on the way</p>
            </div>
            <div className="game-night__soon-card game-night__soon-card--muted" aria-hidden>
              <span className="game-night__soon-lock">+</span>
              <p className="game-night__soon-label">Your pick</p>
              <p className="game-night__soon-hint">Suggest one in chat</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}