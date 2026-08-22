import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { SettingsIcon } from '../components/Icons'
import { CloudSyncCard } from '../components/CloudSyncCard'
import { PersonProfileCard } from '../components/PersonProfileCard'
import { StorageCard } from '../components/StorageCard'
import { ScrollRegion } from '../components/ScrollRegion'
import { SpotifyConnectCard } from '../components/SpotifyConnectCard'
import { useCouple } from '../context/CoupleContext'
import { cardMemberSlot } from '../components/CardBuddy'
import { normalizeCoupleProfile } from '../storage'
import type { CoupleProfile, PersonProfile } from '../types'

interface UsScreenProps {
  profile: CoupleProfile
  onSave: (profile: CoupleProfile) => void | Promise<void>
}

export function UsScreen({ profile, onSave }: UsScreenProps) {
  const { isCloud, slot } = useCouple()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [since, setSince] = useState(profile.since)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const safeProfile = normalizeCoupleProfile(profile)

  useEffect(() => {
    setSince(profile.since)
  }, [profile.since])

  useEffect(() => {
    if (!settingsOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [settingsOpen])

  async function savePerson(
    who: 'you' | 'partner',
    next: { name: string; person: PersonProfile },
  ) {
    setBusy(true)
    try {
      const updated =
        who === 'you'
          ? normalizeCoupleProfile({
              ...safeProfile,
              nameYou: next.name,
              you: next.person,
            })
          : normalizeCoupleProfile({
              ...safeProfile,
              namePartner: next.name,
              partner: next.person,
            })
      await onSave(updated)
    } finally {
      setBusy(false)
    }
  }

  async function submitSince(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      await onSave(normalizeCoupleProfile({ ...safeProfile, since }))
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    } finally {
      setBusy(false)
    }
  }

  function closeSettings() {
    setSettingsOpen(false)
  }

  return (
    <div className="screen screen--us">
      <header className="us-hero">
        <button
          type="button"
          className="us-topbar__settings us-hero__settings"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings"
        >
          <SettingsIcon size={22} />
        </button>
        <span className="us-hero__mark" aria-hidden>
          <img
            src={`${import.meta.env.BASE_URL}favicon.jpg`}
            alt=""
            width={52}
            height={52}
          />
        </span>
        <h1>Us</h1>
        <p>
          {safeProfile.nameYou} & {safeProfile.namePartner}
        </p>
      </header>

      <ScrollRegion className="screen__scroll us-profiles">
        <PersonProfileCard
          who="you"
          memberSlot={cardMemberSlot('you', slot)}
          name={safeProfile.nameYou}
          person={safeProfile.you}
          busy={busy}
          onSave={(next) => savePerson('you', next)}
        />
        <PersonProfileCard
          who="partner"
          memberSlot={cardMemberSlot('partner', slot)}
          name={safeProfile.namePartner}
          person={safeProfile.partner}
          busy={busy}
          onSave={(next) => savePerson('partner', next)}
        />
      </ScrollRegion>

      {settingsOpen
        ? createPortal(
            <div
              className="sheet-backdrop sheet-backdrop--full us-settings-backdrop"
              role="presentation"
              onClick={(event) => {
                if (event.target === event.currentTarget) closeSettings()
              }}
            >
              <div
                className="sheet sheet--full us-settings"
                role="dialog"
                aria-modal="true"
                aria-labelledby="us-settings-title"
              >
                <header className="sheet__header us-settings__header">
                  <h2 id="us-settings-title">Settings</h2>
                  <button
                    type="button"
                    className="us-settings__done"
                    onClick={closeSettings}
                  >
                    Done
                  </button>
                </header>

                <ScrollRegion className="us-settings__scroll">
                  <section className="us-settings__group">
                    <p className="us-settings__label">Account</p>
                    <div className="us-settings__stack">
                      <CloudSyncCard />
                      <StorageCard />
                    </div>
                  </section>

                  <section className="us-settings__group">
                    <p className="us-settings__label">Music</p>
                    <div className="us-settings__stack">
                      <SpotifyConnectCard />
                    </div>
                  </section>

                  <section className="us-settings__group">
                    <p className="us-settings__label">Together</p>
                    <div className="us-settings__stack">
                      <form
                        className="surface form-card"
                        onSubmit={(event) => void submitSince(event)}
                      >
                        <label className="field field--date">
                          <span>Together since</span>
                          <span className="field__control">
                            <input
                              type="date"
                              value={since}
                              onChange={(event) => setSince(event.target.value)}
                            />
                          </span>
                        </label>

                        <button
                          type="submit"
                          className="btn btn--primary btn--sm"
                          disabled={busy}
                        >
                          {saved ? 'Saved' : 'Save date'}
                        </button>
                      </form>
                    </div>
                  </section>

                  <p className="fineprint">
                    {isCloud
                      ? 'Changes sync to both phones while you are signed in.'
                      : 'On this device only until you sign in.'}
                  </p>
                </ScrollRegion>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
