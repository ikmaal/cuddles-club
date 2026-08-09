import { useEffect, useRef, useState } from 'react'
import { CheckIcon, PencilIcon } from '../components/Icons'
import { CloudSyncCard } from '../components/CloudSyncCard'
import { ScrollRegion } from '../components/ScrollRegion'
import { SpotifyConnectCard } from '../components/SpotifyConnectCard'
import { useCouple } from '../context/CoupleContext'
import { daysTogether } from '../hooks/useProfile'
import type { CoupleProfile } from '../types'

interface UsScreenProps {
  profile: CoupleProfile
  onSave: (profile: CoupleProfile) => void
}

export function UsScreen({ profile, onSave }: UsScreenProps) {
  const { isCloud } = useCouple()
  const [nameYou, setNameYou] = useState(profile.nameYou)
  const [namePartner, setNamePartner] = useState(profile.namePartner)
  const [since, setSince] = useState(profile.since)
  const [editingYou, setEditingYou] = useState(false)
  const [editingPartner, setEditingPartner] = useState(false)
  const [saved, setSaved] = useState(false)
  const youInputRef = useRef<HTMLInputElement>(null)
  const partnerInputRef = useRef<HTMLInputElement>(null)

  const days = daysTogether(profile.since)

  useEffect(() => {
    setNameYou(profile.nameYou)
    setNamePartner(profile.namePartner)
    setSince(profile.since)
  }, [profile.nameYou, profile.namePartner, profile.since])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    onSave({ nameYou, namePartner, since })
    setEditingYou(false)
    setEditingPartner(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  function startEditYou() {
    setEditingYou(true)
    window.requestAnimationFrame(() => youInputRef.current?.focus())
  }

  function startEditPartner() {
    setEditingPartner(true)
    window.requestAnimationFrame(() => partnerInputRef.current?.focus())
  }

  return (
    <div className="screen screen--us">
      <ScrollRegion className="screen__scroll">
        <header className="us-hero">
          <span className="us-hero__mark" aria-hidden>
            <img
              src={`${import.meta.env.BASE_URL}favicon.jpg`}
              alt=""
              width={52}
              height={52}
            />
          </span>
          <h1>
            {profile.nameYou} & {profile.namePartner}
          </h1>
          <p>
            {days === null
              ? 'Add the day it started below'
              : `${days.toLocaleString()} ${days === 1 ? 'day' : 'days'} together`}
          </p>
        </header>

        <CloudSyncCard />

        <SpotifyConnectCard />

        <form className="surface form-card" onSubmit={submit}>
          <div className="section-head section-head--tight">
            <h2>Names</h2>
          </div>

          <label className={`field${editingYou ? '' : ' is-locked'}`}>
            <span>You</span>
            <div className="field__row">
              <input
                ref={youInputRef}
                value={nameYou}
                onChange={(event) => setNameYou(event.target.value)}
                maxLength={18}
                readOnly={!editingYou}
                aria-readonly={!editingYou}
              />
              {editingYou ? (
                <button
                  type="button"
                  className="ghost-icon"
                  onClick={() => setEditingYou(false)}
                  aria-label="Done editing your name"
                >
                  <CheckIcon size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  className="ghost-icon"
                  onClick={startEditYou}
                  aria-label="Edit your name"
                >
                  <PencilIcon size={18} />
                </button>
              )}
            </div>
          </label>

          <label className={`field${editingPartner ? '' : ' is-locked'}`}>
            <span>Your partner</span>
            <div className="field__row">
              <input
                ref={partnerInputRef}
                value={namePartner}
                onChange={(event) => setNamePartner(event.target.value)}
                maxLength={18}
                readOnly={!editingPartner}
                aria-readonly={!editingPartner}
              />
              {editingPartner ? (
                <button
                  type="button"
                  className="ghost-icon"
                  onClick={() => setEditingPartner(false)}
                  aria-label="Done editing partner name"
                >
                  <CheckIcon size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  className="ghost-icon"
                  onClick={startEditPartner}
                  aria-label="Edit partner name"
                >
                  <PencilIcon size={18} />
                </button>
              )}
            </div>
          </label>

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

          <button type="submit" className="btn btn--primary btn--sm">
            {saved ? 'Saved' : 'Save'}
          </button>
        </form>

        <p className="fineprint">
          {isCloud
            ? 'Your couple data syncs through Supabase when you are signed in.'
            : 'Without cloud sync, everything stays on this device only.'}
        </p>
      </ScrollRegion>
    </div>
  )
}
