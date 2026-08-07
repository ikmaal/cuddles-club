import { MOODS } from '../data'
import { ScrollRegion } from '../components/ScrollRegion'
import { ScreenHeader } from '../components/ScreenHeader'
import { todayKey } from '../hooks/useStored'
import type { Carer, CoupleProfile, MoodEntry, MoodKey } from '../types'

interface MoodScreenProps {
  moods: MoodEntry[]
  profile: CoupleProfile
  onSet: (who: Carer, mood: MoodKey) => void
  onBack: () => void
}

function lastDays(count: number): string[] {
  const days: string[] = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(todayKey(date))
  }
  return days
}

function emojiFor(mood?: MoodKey): string {
  return MOODS.find((entry) => entry.key === mood)?.emoji ?? '·'
}

export function MoodScreen({ moods, profile, onSet, onBack }: MoodScreenProps) {
  const today = todayKey()
  const entry = moods.find((item) => item.day === today)
  const week = lastDays(7)

  const rows: { who: Carer; name: string; value?: MoodKey }[] = [
    { who: 'you', name: profile.nameYou, value: entry?.you },
    { who: 'partner', name: profile.namePartner, value: entry?.partner },
  ]

  return (
    <div className="screen">
      <ScreenHeader
        title="Mood"
        subtitle="A quick check-in, just the two of you"
        onBack={onBack}
      />

      <ScrollRegion className="screen__scroll">
        {rows.map((row) => (
          <div key={row.who} className="surface mood-card">
            <div className="mood-card__head">
              <span className={`pill pill--${row.who}`}>{row.name}</span>
              <span className="mood-card__status">
                {row.value ? 'Checked in' : 'Not yet today'}
              </span>
            </div>
            <div className="mood-options" role="group" aria-label={`${row.name} mood`}>
              {MOODS.map((mood) => (
                <button
                  key={mood.key}
                  type="button"
                  className={`mood-option ${row.value === mood.key ? 'is-active' : ''}`}
                  onClick={() => onSet(row.who, mood.key)}
                  aria-pressed={row.value === mood.key}
                >
                  <span className="mood-option__emoji" aria-hidden>
                    {mood.emoji}
                  </span>
                  <span className="mood-option__label">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="section-block">
          <div className="section-head section-head--tight">
            <h2>Last 7 days</h2>
          </div>

          <div className="surface week">
            {week.map((day) => {
              const record = moods.find((item) => item.day === day)
              const date = new Date(`${day}T00:00:00`)
              return (
                <div key={day} className={`week__day ${day === today ? 'is-today' : ''}`}>
                  <span className="week__label">
                    {date.toLocaleDateString(undefined, { weekday: 'narrow' })}
                  </span>
                  <span className="week__emoji" aria-hidden>
                    {emojiFor(record?.you)}
                  </span>
                  <span className="week__emoji" aria-hidden>
                    {emojiFor(record?.partner)}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="week__legend">
            Top row is {profile.nameYou}, bottom row is {profile.namePartner}.
          </p>
        </div>
      </ScrollRegion>
    </div>
  )
}
