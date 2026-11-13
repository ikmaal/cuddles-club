import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { BackIcon } from '../components/Icons'
import {
  BIRTHDAY_ITINERARY_DAYS,
  BIRTHDAY_ITINERARY_INTRO,
  BIRTHDAY_ITINERARY_NOTES,
  BIRTHDAY_LETTER,
} from '../lib/birthdayItinerary'

interface BirthdayItineraryScreenProps {
  onBack: () => void
}

const SLIDE_COUNT = 3 + BIRTHDAY_ITINERARY_DAYS.length

export function BirthdayItineraryScreen({ onBack }: BirthdayItineraryScreenProps) {
  const [slideProgress, setSlideProgress] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const onScroll = () => {
      const width = Math.max(1, track.clientWidth)
      const progress = track.scrollLeft / width
      const clampedProgress = Math.max(0, Math.min(progress, SLIDE_COUNT - 1))
      setSlideProgress(clampedProgress)
    }

    onScroll()
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="screen screen--birthday screen--birthday-itinerary">
      <header className="birthday-itinerary__header">
        <button
          type="button"
          className="birthday-itinerary__back"
          onClick={onBack}
          aria-label="Back"
        >
          <BackIcon size={18} />
        </button>
        <h1 className="birthday-itinerary__title">birthday itinerary</h1>
      </header>

      <div
        className="birthday-itinerary__slider-nav"
        aria-hidden
        style={
          {
            '--slide-count': SLIDE_COUNT,
            '--slide-progress': slideProgress,
          } as CSSProperties
        }
      >
        <div className="birthday-itinerary__slider-rail">
          <span className="birthday-itinerary__slider-line" />
        </div>
      </div>

      <div
        ref={trackRef}
        className="birthday-itinerary__track"
        aria-live="polite"
      >
        <section className="birthday-itinerary__slide" aria-label="Birthday letter">
          <article className="birthday-itinerary__card birthday-itinerary__card--letter">
            <div className="birthday-itinerary__banner">{BIRTHDAY_LETTER.banner}</div>
            <div className="birthday-itinerary__letter">
              {BIRTHDAY_LETTER.paragraphs.map((paragraph, index) => (
                <p key={index} className="birthday-itinerary__letter-p">
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        </section>

        <section className="birthday-itinerary__slide" aria-label="Itinerary intro">
          <article className="birthday-itinerary__card birthday-itinerary__card--intro">
            <p className="birthday-itinerary__intro">{BIRTHDAY_ITINERARY_INTRO}</p>
          </article>
        </section>

        {BIRTHDAY_ITINERARY_DAYS.map((day) => (
          <section
            key={day.id}
            className="birthday-itinerary__slide"
            aria-label={day.banner}
          >
            <article className="birthday-itinerary__card">
              <div className="birthday-itinerary__banner">{day.banner}</div>

              <ol className="birthday-itinerary__timeline">
                {day.items.map((item, index) => (
                  <li key={`${day.id}-${index}`} className="birthday-itinerary__stop">
                    <span className="birthday-itinerary__node" aria-hidden />
                    <p className="birthday-itinerary__text">{item}</p>
                  </li>
                ))}
              </ol>
            </article>
          </section>
        ))}

        <section className="birthday-itinerary__slide" aria-label={BIRTHDAY_ITINERARY_NOTES.title}>
          <article className="birthday-itinerary__card">
            <div className="birthday-itinerary__banner">{BIRTHDAY_ITINERARY_NOTES.title}</div>
            <ul className="birthday-itinerary__notes">
              {BIRTHDAY_ITINERARY_NOTES.items.map((item, index) => (
                <li key={index} className="birthday-itinerary__notes-item">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </div>
  )
}
