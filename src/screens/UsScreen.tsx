import { useState } from 'react'
import { CloudSyncCard } from '../components/CloudSyncCard'
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
  const [saved, setSaved] = useState(false)

  const days = daysTogether(profile.since)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    onSave({ nameYou, namePartner, since })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="screen screen--us">
      <div className="screen__scroll">
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

        <form className="surface form-card" onSubmit={submit}>
          <div className="section-head section-head--tight">
            <h2>Names</h2>
          </div>

          <label className="field">
            <span>You</span>
            <input
              value={nameYou}
              onChange={(event) => setNameYou(event.target.value)}
              maxLength={18}
            />
          </label>

          <label className="field">
            <span>Your partner</span>
            <input
              value={namePartner}
              onChange={(event) => setNamePartner(event.target.value)}
              maxLength={18}
            />
          </label>

          <label className="field">
            <span>Together since</span>
            <input
              type="date"
              value={since}
              onChange={(event) => setSince(event.target.value)}
            />
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
      </div>
    </div>
  )
}
