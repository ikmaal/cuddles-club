import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import {
  BackIcon,
  CalendarIcon,
  CheckIcon,
  ChevronIcon,
} from '../components/Icons'
import { ScrollRegion } from '../components/ScrollRegion'
import { weekRangeStart, weekTitle, type UsePoopTrackerReturn } from '../hooks/usePoopTracker'
import type { Carer, CoupleProfile } from '../types'

interface PoopTrackerScreenProps extends UsePoopTrackerReturn {
  profile: CoupleProfile
  onBack: () => void
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}

function formatCardDate(date = new Date()): string {
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()
  const rest = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase()
  return `${weekday}, ${rest}`
}

function streakLabel(days: number): string {
  return `${days} day${days === 1 ? '' : 's'}`
}

function GutInsightBody({
  daysSince,
  streak,
}: {
  daysSince: number | null
  streak: number
}) {
  if (daysSince === null) {
    return <>Log your first poop to start tracking.</>
  }
  if (daysSince === 0) {
    return (
      <>
        You&apos;re on a <strong>{streakLabel(streak)}</strong> streak.
      </>
    )
  }
  if (daysSince === 1) {
    return <>You last pooped yesterday.</>
  }
  if (daysSince <= 3) {
    return (
      <>
        You last pooped <strong>{daysSince} days</strong> ago.
      </>
    )
  }
  return (
    <>
      It&apos;s been <strong>{daysSince} days</strong> since your last log.
    </>
  )
}

export function PoopTrackerScreen({
  profile,
  logPoop,
  statsFor,
  refresh,
  error,
  isCloud,
  onBack,
}: PoopTrackerScreenProps) {
  const [owner, setOwner] = useState<Carer>('you')
  const [weekOffset, setWeekOffset] = useState(0)
  const [justLogged, setJustLogged] = useState(false)
  const [logFailed, setLogFailed] = useState(false)
  const weekSwipeRef = useRef({ startX: 0, tracking: false })

  const names = useMemo(
    () => ({
      you: profile.nameYou,
      partner: profile.namePartner,
    }),
    [profile.namePartner, profile.nameYou],
  )

  const stats = statsFor(owner, weekOffset)
  const displayName = firstName(names[owner])
  const weekLabel = weekTitle(weekOffset)
  const canGoForward = weekOffset < 0

  useEffect(() => {
    setWeekOffset(0)
  }, [owner])

  function goToOlderWeek() {
    setWeekOffset((current) => current - 1)
  }

  function goToNewerWeek() {
    setWeekOffset((current) => (current < 0 ? current + 1 : current))
  }

  function handleWeekSwipeStart(event: PointerEvent<HTMLElement>) {
    weekSwipeRef.current = { startX: event.clientX, tracking: true }
  }

  function handleWeekSwipeEnd(event: PointerEvent<HTMLElement>) {
    if (!weekSwipeRef.current.tracking) return
    const delta = event.clientX - weekSwipeRef.current.startX
    weekSwipeRef.current.tracking = false
    if (Math.abs(delta) < 48) return
    if (delta < 0) goToOlderWeek()
    else goToNewerWeek()
  }

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function handleLog() {
    setLogFailed(false)
    const entry = await logPoop(owner)
    if (!entry) {
      setLogFailed(true)
      return
    }
    setJustLogged(true)
    window.setTimeout(() => setJustLogged(false), 1800)
  }

  return (
    <div className="screen screen--poop">
      <header className="poop-topbar">
        <button type="button" className="poop-back" onClick={onBack} aria-label="Back">
          <BackIcon size={18} />
        </button>
        <div className="poop-switch" role="tablist" aria-label="Whose tracker">
          {(['you', 'partner'] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={owner === id}
              className={owner === id ? 'is-on' : ''}
              onClick={() => setOwner(id)}
            >
              {firstName(names[id]).toLowerCase()}
            </button>
          ))}
        </div>
        <span className="poop-topbar__spacer" aria-hidden />
      </header>

      {error ? (
        <p className="poop-sync-error" role="alert">
          {error}
          {!isCloud ? ' Sign in on the Us tab to sync with your partner.' : ''}
        </p>
      ) : null}

      {logFailed ? (
        <p className="poop-sync-error" role="alert">
          Could not save that log. Check your connection and try again.
        </p>
      ) : null}

      <ScrollRegion className="screen__scroll poop-scroll">
        <section className="poop-hero" aria-label="Summary">
          <div className="poop-hero__copy">
            <h1>
              Hey {displayName.toLowerCase()},
              <br />
              you&apos;re doing
              <br />
              <em>great</em> so far.
            </h1>
          </div>
          <div className="poop-mascot" aria-hidden>
            <img src={`${import.meta.env.BASE_URL}poopmascot.png`} alt="" />
          </div>
        </section>

        <div className="poop-stat-row">
          <article className="poop-stat-card">
            <p className="poop-stat-card__label">Longest streak</p>
            <p className="poop-stat-card__value">{streakLabel(stats.longestStreak)}</p>
          </article>
          <article className="poop-stat-card">
            <p className="poop-stat-card__label">Last poop was</p>
            <p className="poop-stat-card__value">{stats.lastPoopLabel}</p>
          </article>
        </div>

        <button
          type="button"
          className={`poop-log-btn${justLogged ? ' is-logged' : ''}`}
          onClick={handleLog}
        >
          <span className="poop-log-btn__icon" aria-hidden>
            <CheckIcon size={16} />
          </span>
          <span>{justLogged ? 'Logged!' : 'I just pooped'}</span>
        </button>

        <section
          className="poop-card poop-week"
          aria-label="Weekly overview"
          onPointerDown={handleWeekSwipeStart}
          onPointerUp={handleWeekSwipeEnd}
          onPointerCancel={handleWeekSwipeEnd}
        >
          <div className="poop-week__header">
            <div className="poop-week__header-main">
              <button
                type="button"
                className="poop-week__nav"
                onClick={goToOlderWeek}
                aria-label="Previous week"
              >
                <ChevronIcon size={16} />
              </button>
              <div className="poop-week__header-copy">
                <p className="poop-week__date">
                  <CalendarIcon size={14} />
                  {formatCardDate(weekRangeStart(weekOffset))}
                </p>
                <h2 className="poop-week__title">{weekLabel}</h2>
              </div>
              <button
                type="button"
                className="poop-week__nav poop-week__nav--next"
                onClick={goToNewerWeek}
                disabled={!canGoForward}
                aria-label="Next week"
              >
                <ChevronIcon size={16} />
              </button>
            </div>
            <div className="poop-week__badge" aria-label={`${stats.weekTotal} logs this week`}>
              <strong>{stats.weekTotal}</strong>
              <span>this week</span>
            </div>
          </div>

          <div className="poop-week__chart">
            {stats.week.map((bar) => {
              const active = !bar.isFuture && bar.count > 0
              return (
                <div
                  key={bar.key}
                  className={`poop-week__col${bar.isToday ? ' is-today' : ''}${bar.isFuture ? ' is-future' : ''}${active ? ' is-active' : ''}`}
                >
                  <div className="poop-week__track" aria-hidden>
                    {active ? <span className="poop-week__count">{bar.count}</span> : null}
                  </div>
                  <span className="poop-week__label">{bar.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="poop-insight" aria-label="Gut health insight">
          <div className="poop-insight__copy">
            <h3>{stats.gut.title}</h3>
            <p>
              <GutInsightBody daysSince={stats.daysSinceLast} streak={stats.currentStreak} />
            </p>
            <p className="poop-insight__meta">
              {stats.todayCount > 0
                ? `${stats.todayCount} today · ${stats.total} total`
                : `${stats.total} logs total`}
            </p>
          </div>
          <ChevronIcon size={18} />
        </section>
      </ScrollRegion>
    </div>
  )
}
