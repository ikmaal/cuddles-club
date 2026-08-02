import { useMemo, useState } from 'react'
import { TrashIcon } from '../components/Icons'
import { ScreenHeader } from '../components/ScreenHeader'
import { daysUntil } from '../hooks/useCoupleData'
import type { Countdown } from '../types'

interface CountdownScreenProps {
  events: Countdown[]
  onAdd: (label: string, date: string, repeatsYearly: boolean) => void
  onRemove: (id: string) => void
  onBack: () => void
}

function dayLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} days ago`
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `${days} days`
}

export function CountdownScreen({
  events,
  onAdd,
  onRemove,
  onBack,
}: CountdownScreenProps) {
  const [label, setLabel] = useState('')
  const [date, setDate] = useState('')
  const [repeats, setRepeats] = useState(true)

  const sorted = useMemo(
    () =>
      events
        .map((event) => ({ event, days: daysUntil(event) }))
        .filter((entry): entry is { event: Countdown; days: number } => entry.days !== null)
        // Upcoming first, then anything already past.
        .sort((a, b) => {
          if (a.days < 0 !== b.days < 0) return a.days < 0 ? 1 : -1
          return a.days - b.days
        }),
    [events],
  )

  function submit(event: React.FormEvent) {
    event.preventDefault()
    onAdd(label, date, repeats)
    setLabel('')
    setDate('')
  }

  return (
    <div className="screen">
      <ScreenHeader
        title="Countdowns"
        subtitle="Days until the moments that matter"
        onBack={onBack}
      />

      <div className="screen__scroll">
        <form className="surface form-card" onSubmit={submit}>
          <label className="field">
            <span>What is it?</span>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Our anniversary"
              maxLength={40}
            />
          </label>

          <label className="field">
            <span>Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>

          <label className="switch">
            <input
              type="checkbox"
              checked={repeats}
              onChange={(event) => setRepeats(event.target.checked)}
            />
            <span className="switch__track" aria-hidden>
              <span className="switch__thumb" />
            </span>
            <span className="switch__label">Repeats every year</span>
          </label>

          <button
            type="submit"
            className="btn btn--primary btn--sm"
            disabled={!label.trim() || !date}
          >
            Add countdown
          </button>
        </form>

        {sorted.length === 0 ? (
          <div className="empty">
            <p className="empty__title">Nothing on the calendar</p>
            <p className="empty__body">
              Add a birthday, a trip, or the day you met.
            </p>
          </div>
        ) : (
          <ul className="event-list">
            {sorted.map(({ event, days }) => (
              <li key={event.id} className="surface event">
                <div
                  className={`event__days ${days < 0 ? 'is-past' : days <= 7 ? 'is-soon' : ''}`}
                >
                  {days < 0 ? (
                    <span className="event__days-past">Passed</span>
                  ) : (
                    <>
                      <strong>{days}</strong>
                      <span>{days === 1 ? 'day' : 'days'}</span>
                    </>
                  )}
                </div>
                <div className="event__text">
                  <p className="event__label">{event.label}</p>
                  <p className="event__meta">
                    {dayLabel(days)}
                    {event.repeatsYearly ? ' · yearly' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  className="ghost-icon"
                  onClick={() => onRemove(event.id)}
                  aria-label={`Remove ${event.label}`}
                >
                  <TrashIcon size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
