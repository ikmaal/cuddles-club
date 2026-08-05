import { useState } from 'react'
import { useCouple } from '../context/CoupleContext'

export function CloudSyncCard() {
  const {
    isConfigured,
    isCloud,
    user,
    inviteCode,
    authBusy,
    authError,
    signIn,
    signUp,
    signOut,
    createSpace,
    joinSpace,
  } = useCouple()

  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [message, setMessage] = useState('')

  if (!isConfigured) {
    return (
      <section className="surface cloud-card">
        <div className="section-head section-head--tight">
          <h2>Cloud sync</h2>
        </div>
        <p className="cloud-card__body">
          Add your Supabase keys to a <code>.env</code> file to sync data between your phones.
          See <code>.env.example</code> and <code>supabase/schema.sql</code>.
        </p>
      </section>
    )
  }

  if (isCloud) {
    return (
      <section className="surface cloud-card">
        <div className="section-head section-head--tight">
          <h2>Cloud sync</h2>
          <span className="tag tag-positive">Connected</span>
        </div>
        <p className="cloud-card__body">
          Signed in as <strong>{user?.email}</strong>. Your couple space is synced in real time.
        </p>
        {inviteCode ? (
          <div className="cloud-card__invite">
            <span>Invite code for your partner</span>
            <strong>{inviteCode}</strong>
          </div>
        ) : null}
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => void signOut()}
          disabled={authBusy}
        >
          Sign out
        </button>
      </section>
    )
  }

  if (user) {
    return (
      <section className="surface cloud-card">
        <div className="section-head section-head--tight">
          <h2>Link your couple space</h2>
        </div>
        <p className="cloud-card__body">
          Signed in as <strong>{user.email}</strong>. Create a new space or join with your
          partner&apos;s invite code.
        </p>
        {authError ? (
          <p className="cloud-card__error" role="alert">
            {authError}
          </p>
        ) : null}
        {message ? <p className="cloud-card__success">{message}</p> : null}
        <div className="cloud-card__actions">
          <button
            type="button"
            className="btn btn--primary btn--sm"
            disabled={authBusy}
            onClick={async () => {
              const ok = await createSpace()
              if (ok) setMessage('Couple space created. Share the invite code below.')
            }}
          >
            Create couple space
          </button>
        </div>
        <label className="field">
          <span>Partner invite code</span>
          <input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
          />
        </label>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          disabled={authBusy || joinCode.trim().length < 6}
          onClick={async () => {
            const ok = await joinSpace(joinCode)
            if (ok) setMessage('Joined your couple space.')
          }}
        >
          Join couple space
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => void signOut()}
          disabled={authBusy}
        >
          Sign out
        </button>
      </section>
    )
  }

  return (
    <section className="surface cloud-card">
      <div className="section-head section-head--tight">
        <h2>Cloud sync</h2>
      </div>
      <p className="cloud-card__body">
        Sign in to sync notes, moods, Mochi, and photostrips between both phones.
      </p>
      <div className="cloud-card__tabs">
        <button
          type="button"
          className={mode === 'sign-in' ? 'is-active' : ''}
          onClick={() => setMode('sign-in')}
        >
          Sign in
        </button>
        <button
          type="button"
          className={mode === 'sign-up' ? 'is-active' : ''}
          onClick={() => setMode('sign-up')}
        >
          Sign up
        </button>
      </div>
      {authError ? (
        <p className="cloud-card__error" role="alert">
          {authError}
        </p>
      ) : null}
      <label className="field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
        />
      </label>
      <button
        type="button"
        className="btn btn--primary btn--sm"
        disabled={authBusy || !email || password.length < 6}
        onClick={async () => {
          const ok =
            mode === 'sign-in'
              ? await signIn(email, password)
              : await signUp(email, password)
          if (ok && mode === 'sign-up') {
            setMessage('Account created. You can create or join a couple space next.')
          }
        }}
      >
        {authBusy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
      </button>
      {message ? <p className="cloud-card__success">{message}</p> : null}
    </section>
  )
}
