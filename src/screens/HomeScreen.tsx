import { useMemo, useState } from 'react'
import { ChevronIcon, HeartIcon, SearchIcon } from '../components/Icons'
import { Logo } from '../components/Logo'
import { SERVICES, UPCOMING } from '../services'
import type { CoupleProfile, Screen } from '../types'

export interface HomeSummary {
  catName: string
  catMoodLine: string
  catLevel: number
  noteCount: number
  latestNote: string | null
  bucketDone: number
  bucketTotal: number
  nextEvent: { label: string; days: number } | null
  daysTogether: number | null
  moodLoggedToday: boolean
  questionOfTheDay: string
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
  const [query, setQuery] = useState('')
  const [showUpcoming, setShowUpcoming] = useState(false)

  const trimmed = query.trim().toLowerCase()
  const services = useMemo(() => {
    if (!trimmed) return SERVICES
    return SERVICES.filter(
      (service) =>
        service.label.toLowerCase().includes(trimmed) ||
        service.keywords.some((word) => word.includes(trimmed)),
    )
  }, [trimmed])

  const searching = trimmed.length > 0

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
        <div className="searchbar">
          <span className="searchbar__icon" aria-hidden>
            <SearchIcon size={20} />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="What should we do today?"
            aria-label="Search what you can do"
          />
          {searching ? (
            <button
              type="button"
              className="searchbar__clear"
              onClick={() => setQuery('')}
            >
              Clear
            </button>
          ) : null}
        </div>

        <section className="surface services" aria-label="Things you can do">
          {services.length === 0 ? (
            <p className="services__empty">
              Nothing matches “{query.trim()}” yet.
            </p>
          ) : (
            <ul className="services__grid">
              {services.map((service) => (
                <li key={service.id}>
                  <button
                    type="button"
                    className="service"
                    onClick={() => {
                      if (service.id === 'more') {
                        setShowUpcoming((prev) => !prev)
                        return
                      }
                      onOpen(service.id as Screen)
                    }}
                  >
                    <span className={`service__tile service__tile--${service.tone}`}>
                      <service.Icon size={26} />
                    </span>
                    <span className="service__label">{service.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showUpcoming && !searching ? (
            <div className="services__upcoming">
              <p className="services__upcoming-title">In the works</p>
              <ul>
                {UPCOMING.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {searching ? null : (
          <>
            <section aria-label="Pick up where you left off">
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

                <button
                  type="button"
                  className="promo promo--question"
                  onClick={() => onOpen('question')}
                >
                  <span className="promo__eyebrow">Question of the day</span>
                  <span className="promo__title promo__title--sm">
                    {summary.questionOfTheDay}
                  </span>
                  <span className="promo__cta">
                    Answer together
                    <ChevronIcon size={16} />
                  </span>
                </button>

                <button
                  type="button"
                  className="promo promo--event"
                  onClick={() => onOpen(summary.nextEvent ? 'countdown' : 'roulette')}
                >
                  <span className="promo__eyebrow">
                    {summary.nextEvent ? 'Coming up' : 'No plans yet'}
                  </span>
                  <span className="promo__title promo__title--sm">
                    {summary.nextEvent
                      ? summary.nextEvent.label
                      : 'Let the wheel decide'}
                  </span>
                  <span className="promo__body">
                    {summary.nextEvent
                      ? summary.nextEvent.days === 0
                        ? 'That’s today'
                        : `In ${summary.nextEvent.days} ${
                            summary.nextEvent.days === 1 ? 'day' : 'days'
                          }`
                      : 'Spin for a date idea'}
                  </span>
                  <span className="promo__cta">
                    {summary.nextEvent ? 'See countdowns' : 'Spin the wheel'}
                    <ChevronIcon size={16} />
                  </span>
                </button>
              </div>
            </section>

            <section aria-label="Us by the numbers">
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
                  <span className="metric__label">Bucket list done</span>
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

              {summary.moodLoggedToday ? null : (
                <button
                  type="button"
                  className="surface nudge"
                  onClick={() => onOpen('mood')}
                >
                  <span className="nudge__text">
                    Neither of you has checked in today
                  </span>
                  <span className="nudge__cta">Log a mood</span>
                </button>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
