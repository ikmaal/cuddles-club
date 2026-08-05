import { ChevronIcon, HeartIcon } from '../components/Icons'
import { Logo } from '../components/Logo'
import { SERVICES } from '../services'
import type { CoupleProfile, Screen } from '../types'

export interface HomeSummary {
  catName: string
  catMoodLine: string
  catLevel: number
  noteCount: number
  latestNote: string | null
  bucketDone: number
  bucketTotal: number
  daysTogether: number | null
}

interface HomeScreenProps {
  profile: CoupleProfile
  summary: HomeSummary
  onOpen: (screen: Screen) => void
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Still up?'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function initials(profile: CoupleProfile): string {
  const a = profile.nameYou.trim()[0] ?? 'Y'
  const b = profile.namePartner.trim()[0] ?? 'P'
  return `${a}${b}`.toUpperCase()
}

export function HomeScreen({ profile, summary, onOpen }: HomeScreenProps) {
  return (
    <div className="home">
      <header className="home__top">
        <span className="home__mark" aria-hidden>
          <Logo size={40} />
        </span>
        <div className="home__greet">
          <p className="home__hello">{greeting()}</p>
          <h1>
            {profile.nameYou} & {profile.namePartner}
          </h1>
        </div>
        <button
          type="button"
          className="home__avatar"
          onClick={() => onOpen('us')}
          aria-label="Open our profile"
        >
          {initials(profile)}
        </button>
      </header>

      <div className="home__scroll">
        <section className="surface services" aria-label="Things you can do">
          <ul className="services__grid">
            {SERVICES.map((service) => (
              <li key={service.id}>
                <button
                  type="button"
                  className="service"
                  onClick={() => onOpen(service.id)}
                >
                  <span className={`service__tile service__tile--${service.tone}`}>
                    <service.Icon size={26} />
                  </span>
                  <span className="service__label">{service.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-section" aria-label="Pick up where you left off">
          <div className="section-head">
            <h2>Pick up where you left off</h2>
          </div>

          <div className="rail">
            <button
              type="button"
              className="promo promo--cat"
              onClick={() => onOpen('cat')}
            >
              <span className="promo__eyebrow">Our Cat · lv {summary.catLevel}</span>
              <span className="promo__title">{summary.catName}</span>
              <span className="promo__body">{summary.catMoodLine}</span>
              <span className="promo__cta">
                Go check on {summary.catName}
                <ChevronIcon size={16} />
              </span>
            </button>
          </div>
        </section>

        <section className="home-section" aria-label="Us by the numbers">
          <div className="section-head">
            <h2>Us, by the numbers</h2>
          </div>

          <ul className="metrics">
            <li className="metric">
              <span className="metric__value">
                {summary.daysTogether === null ? '—' : summary.daysTogether}
              </span>
              <span className="metric__label">
                {summary.daysTogether === null
                  ? 'Add your date'
                  : summary.daysTogether === 1
                    ? 'Day together'
                    : 'Days together'}
              </span>
            </li>
            <li className="metric">
              <span className="metric__value">
                {summary.bucketDone}/{summary.bucketTotal}
              </span>
              <span className="metric__label">Bucket done</span>
            </li>
            <li className="metric">
              <span className="metric__value">{summary.noteCount}</span>
              <span className="metric__label">
                {summary.noteCount === 1 ? 'Love note' : 'Love notes'}
              </span>
            </li>
          </ul>

          {summary.latestNote ? (
            <button
              type="button"
              className="surface latest-note"
              onClick={() => onOpen('notes')}
            >
              <span className="latest-note__icon" aria-hidden>
                <HeartIcon size={18} />
              </span>
              <span className="latest-note__text">“{summary.latestNote}”</span>
              <ChevronIcon size={18} />
            </button>
          ) : null}
        </section>
      </div>
    </div>
  )
}
