import { useEffect, useState, type FormEvent } from 'react'
import { BackIcon } from '../components/Icons'
import {
  BIRTHDAY_APP_PASSCODE,
  isBirthdayAppUnlocked,
  unlockBirthdayApp,
} from '../lib/birthdayAppGate'
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

function BirthdayPasscodeGate({ onBack, onUnlocked }: { onBack: () => void; onUnlocked: () => void }) {
  const [code, setCode] = useState('')
  const [wrong, setWrong] = useState(false)

  function submit(event?: FormEvent) {
    event?.preventDefault()
    const trimmed = code.trim()
    if (trimmed === BIRTHDAY_APP_PASSCODE) {
      unlockBirthdayApp()
      onUnlocked()
      return
    }
    setWrong(true)
    setCode('')
  }

  return (
    <div className="screen screen--birthday">
      <div className="birthday-gate">
        <header className="birthday-gate__top">
          <button type="button" className="birthday-home__back" onClick={onBack} aria-label="Back">
            <BackIcon size={18} />
          </button>
        </header>
        <form className="birthday-gate__form" onSubmit={submit}>
          <p className="birthday-gate__title">Enter code</p>
          <input
            className={`birthday-gate__input${wrong ? ' birthday-gate__input--wrong' : ''}`}
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            placeholder="••••••"
            value={code}
            aria-invalid={wrong}
            aria-describedby={wrong ? 'birthday-gate-error' : undefined}
            onChange={(event) => {
              const next = event.target.value.replace(/\D/g, '').slice(0, 6)
              setCode(next)
              if (wrong) setWrong(false)
            }}
          />
          {wrong ? (
            <p id="birthday-gate-error" className="birthday-gate__error" role="alert">
              Wrong code. Try again.
            </p>
          ) : null}
          <button type="submit" className="birthday-gate__submit" disabled={code.length < 6}>
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}

export function BirthdayScreen({ profile, onBack }: BirthdayScreenProps) {
  const [unlocked, setUnlocked] = useState(isBirthdayAppUnlocked)
  const [itineraryOpen, setItineraryOpen] = useState(false)
  const [countdown, setCountdown] = useState<BirthdayCountdownParts>(() => getBirthdayCountdown())

  const partnerName = firstName(profile.namePartner)
  const countdownTitle = formatBirthdayCountdownTitle()
  const homeImageSrc = `${import.meta.env.BASE_URL}birthday_home.jpg`

  useEffect(() => {
    if (!unlocked) return
    const tick = () => setCountdown(getBirthdayCountdown())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [unlocked])

  if (!unlocked) {
    return <BirthdayPasscodeGate onBack={onBack} onUnlocked={() => setUnlocked(true)} />
  }

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
