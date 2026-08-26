import { useMemo, useState } from 'react'
import { BackIcon } from '../components/Icons'
import { ScrollRegion } from '../components/ScrollRegion'
import type { UsePoopTrackerReturn } from '../hooks/usePoopTracker'
import type { Carer, CoupleProfile } from '../types'

interface PoopTrackerScreenProps extends UsePoopTrackerReturn {
  profile: CoupleProfile
  onBack: () => void
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}

function formatHeaderDate(date = new Date()): string {
  return date
    .toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase()
}

export function PoopTrackerScreen({
  profile,
  logPoop,
  statsFor,
  onBack,
}: PoopTrackerScreenProps) {
  const [owner, setOwner] = useState<Carer>('you')
  const [justLogged, setJustLogged] = useState(false)

  const names = useMemo(
    () => ({
      you: profile.nameYou,
      partner: profile.namePartner,
    }),
    [profile.namePartner, profile.nameYou],
  )

  const stats = statsFor(owner)
  const displayName = firstName(names[owner])

  function handleLog() {
    logPoop(owner)
    setJustLogged(true)
    window.setTimeout(() => setJustLogged(false), 1800)
  }

  return (
    <div className="screen screen--poop">
      <header className="poop-topbar">
        <button type="button" className="poop-back" onClick={onBack} aria-label="Back">
          <BackIcon size={20} />
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

      <ScrollRegion className="screen__scroll poop-scroll">
        <section className="poop-hero" aria-label="Summary">
          <div className="poop-hero__copy">
            <h1>
              {displayName}, you are doing
              <br />
              great so far.
            </h1>
            <div className="poop-hero__stats">
              <div>
                <span className="poop-hero__stat-label">Your longest streak is</span>
                <strong>{stats.longestStreak} days</strong>
              </div>
              <div>
                <span className="poop-hero__stat-label">Your last poop was</span>
                <strong>{stats.lastPoopLabel}</strong>
              </div>
            </div>
          </div>
          <div className="poop-mascot" aria-hidden>
            <span className="poop-mascot__blob">💩</span>
          </div>
        </section>

        <button
          type="button"
          className={`poop-log-btn${justLogged ? ' is-logged' : ''}`}
          onClick={handleLog}
        >
          {justLogged ? 'Logged!' : 'I just pooped'}
        </button>

        <p className="poop-date">{formatHeaderDate()}</p>

        <section className="poop-card poop-week" aria-label="Weekly overview">
          <div className="poop-week__header">
            <div className="poop-week__header-copy">
              <p className="poop-week__eyebrow">Overview</p>
              <h2 className="poop-week__title">This week</h2>
            </div>
            <div className="poop-week__badge" aria-label={`${stats.weekTotal} logs this week`}>
              <strong>{stats.weekTotal}</strong>
              <span>this week</span>
            </div>
          </div>

          <div className="poop-week__panel">
            <div className="poop-week__chart">
              {stats.week.map((bar) => {
                const active = !bar.isFuture && bar.count > 0
                const height = active
                  ? Math.max(28, Math.round((bar.count / stats.maxWeek) * 100))
                  : 0
                const tone = bar.count === 0 ? 'empty' : bar.count >= 2 ? 'great' : 'good'
                return (
                  <div
                    key={bar.key}
                    className={`poop-week__col${bar.isToday ? ' is-today' : ''}${bar.isFuture ? ' is-future' : ''}`}
                  >
                    <div className="poop-week__track" aria-hidden>
                      <div
                        className={`poop-week__fill poop-week__fill--${tone}`}
                        style={{ height: active ? `${height}%` : '0%' }}
                      >
                        {active ? <span className="poop-week__count">{bar.count}</span> : null}
                      </div>
                    </div>
                    <span className="poop-week__label">{bar.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="poop-week__summary">
            <div className="poop-week__summary-icon" aria-hidden>
              ✨
            </div>
            <div className="poop-week__summary-copy">
              <h3>{stats.gut.title}</h3>
              <p>{stats.gut.body}</p>
              <p className="poop-week__meta">
                {stats.todayCount > 0
                  ? `${stats.todayCount} today · ${stats.total} total`
                  : `${stats.total} logs total`}
              </p>
            </div>
          </div>
        </section>
      </ScrollRegion>
    </div>
  )
}
