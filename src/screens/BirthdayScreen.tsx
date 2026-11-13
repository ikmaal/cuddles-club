import { useEffect, useState } from 'react'
import { BackIcon } from '../components/Icons'
import {
  formatBirthdayCountdownTitle,
  getBirthdayCountdown,
  type BirthdayCountdownParts,
} from '../lib/birthdayCountdown'
import type { CoupleProfile } from '../types'
import { BirthdayItineraryScreen } from './BirthdayItineraryScreen'

interface BirthdayScreenProps {
  profile: CoupleProfile
  onBack: () => void
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0')
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}

function CountdownTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="birthday-home__tile">
      <span className="birthday-home__tile-value">{value}</span>
      <span className="birthday-home__tile-label">{label}</span>
    </div>
  )
}

export function BirthdayScreen({ profile, onBack }: BirthdayScreenProps) {
  const [itineraryOpen, setItineraryOpen] = useState(false)
  const [countdown, setCountdown] = useState<BirthdayCountdownParts>(() => getBirthdayCountdown())

  const partnerName = firstName(profile.namePartner)
  const countdownTitle = formatBirthdayCountdownTitle()
  const homeImageSrc = `${import.meta.env.BASE_URL}birthday_home.jpg`

  useEffect(() => {
    const tick = () => setCountdown(getBirthdayCountdown())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  if (itineraryOpen) {
    return <BirthdayItineraryScreen onBack={() => setItineraryOpen(false)} />
  }

  return (
    <div className="screen screen--birthday">
      <div className="birthday-main birthday-home birthday-main--in">
        <header className="birthday-home__header">
          <img
            className="birthday-home__art"
            src={homeImageSrc}
            alt=""
            decoding="async"
          />
          <button
            type="button"
            className="birthday-home__back"
            onClick={onBack}
            aria-label="Back"
          >
            <BackIcon size={18} />
          </button>
        </header>

        <div className="birthday-home__bottom">
          <div className="birthday-home__panel">
            {countdown.reached ? (
              <p className="birthday-home__celebrate" role="status">
                Happy birthday, {partnerName}! ♡
              </p>
            ) : (
              <>
                <h2 className="birthday-home__countdown-title">{countdownTitle}</h2>
                <div className="birthday-home__tiles" aria-live="polite">
                  <CountdownTile value={pad2(countdown.days)} label="Days" />
                  <CountdownTile value={pad2(countdown.hours)} label="Hours" />
                  <CountdownTile value={pad2(countdown.minutes)} label="Minutes" />
                </div>
              </>
            )}
          </div>

          <nav className="birthday-home__nav birthday-home__nav--single" aria-label="Birthday apps">
            <button
              type="button"
              className="birthday-home__nav-btn"
              onClick={() => setItineraryOpen(true)}
            >
              <span className="birthday-home__nav-label">birthday itinerary</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
