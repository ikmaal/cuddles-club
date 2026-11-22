import type { MemberSlot } from '../../lib/coupleSlot'
import {
  duelMyReady,
  duelPartnerReady,
  duelPlayerName,
  type SgGuessDuelRow,
} from '../../lib/sgGuessDuel'

interface SgGuessDuelLobbyProps {
  duel: SgGuessDuelRow
  slot: MemberSlot
  profile: { nameYou: string; namePartner: string }
  isHost: boolean
  realtimeOk: boolean
  duelBusy: boolean
  hasApiKey: boolean
  starting: boolean
  onToggleReady: (ready: boolean) => void
  onStart: () => void
  onLeave: () => void
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function partnerSlot(mySlot: MemberSlot): MemberSlot {
  return mySlot === 'a' ? 'b' : 'a'
}

export function SgGuessDuelLobby({
  duel,
  slot,
  profile,
  isHost,
  realtimeOk,
  duelBusy,
  hasApiKey,
  starting,
  onToggleReady,
  onStart,
  onLeave,
}: SgGuessDuelLobbyProps) {
  const myReady = duelMyReady(duel, slot)
  const partnerReady = duelPartnerReady(duel, slot)
  const bothReady = myReady && partnerReady
  const myName = duelPlayerName(slot, profile, slot)
  const otherSlot = partnerSlot(slot)
  const partnerName = duelPlayerName(otherSlot, profile, slot)
  const partnerIsHost = duel.host_slot === otherSlot

  const startBlockedReason = !hasApiKey
    ? 'Google Maps API key required'
    : !myReady
      ? 'Tap “I’m ready” first'
      : !partnerReady
        ? `Waiting for ${partnerName}`
        : null

  return (
    <section className="sg-duel-lobby" aria-labelledby="sg-duel-lobby-title">
      <div className="sg-duel-lobby__glow" aria-hidden />

      <header className="sg-duel-lobby__head">
        <p className="sg-duel-lobby__kicker">Live 1v1</p>
        <h2 id="sg-duel-lobby-title" className="sg-duel-lobby__title">
          Duel lobby
        </h2>
        <p className={`sg-duel-lobby__sync${realtimeOk ? ' is-live' : ''}`} role="status">
          <span className="sg-duel-lobby__sync-dot" aria-hidden />
          {realtimeOk ? 'Synced — updates in real time' : 'Connecting…'}
        </p>
      </header>

      <div className="sg-duel-lobby__versus">
        <PlayerCard
          name={myName}
          initials={initials(myName)}
          ready={myReady}
          role={isHost ? 'Host' : 'Guest'}
          side="you"
        />
        <span className="sg-duel-lobby__vs" aria-hidden>
          VS
        </span>
        <PlayerCard
          name={partnerName}
          initials={initials(partnerName)}
          ready={partnerReady}
          role={partnerIsHost ? 'Host' : 'Guest'}
          side="partner"
        />
      </div>

      <ol className="sg-duel-lobby__steps">
        <li className={realtimeOk ? 'done' : 'current'}>
          <span>1</span> Both open SG Guess on your phones
        </li>
        <li className={bothReady ? 'done' : myReady || partnerReady ? 'current' : ''}>
          <span>2</span> Both tap <strong>I&apos;m ready</strong>
        </li>
        <li className={bothReady ? 'current' : ''}>
          <span>3</span> {isHost ? 'You start the duel' : 'Host taps Start duel'}
        </li>
      </ol>

      <div className="sg-duel-lobby__actions">
        <button
          type="button"
          className={`sg-guess__btn sg-guess__btn--primary sg-duel-lobby__ready${myReady ? ' is-on' : ''}`}
          disabled={duelBusy}
          onClick={() => onToggleReady(!myReady)}
        >
          {myReady ? "I'm ready ✓" : "I'm ready"}
        </button>

        {isHost ? (
          <button
            type="button"
            className="sg-guess__btn sg-guess__btn--accent sg-duel-lobby__start"
            disabled={Boolean(startBlockedReason) || starting || duelBusy}
            onClick={onStart}
          >
            {starting ? 'Loading maps…' : 'Start duel'}
          </button>
        ) : (
          <p className="sg-duel-lobby__guest-hint">
            {bothReady
              ? 'Locked in — waiting for host to start.'
              : `Ask ${partnerName} to join this lobby and tap ready.`}
          </p>
        )}

        {isHost && startBlockedReason ? (
          <p className="sg-duel-lobby__blocker" role="status">
            {starting ? 'Loading Google Maps…' : startBlockedReason}
          </p>
        ) : null}

        <button type="button" className="sg-guess__btn sg-guess__btn--ghost" onClick={onLeave}>
          Leave lobby
        </button>
      </div>
    </section>
  )
}

function PlayerCard({
  name,
  initials,
  ready,
  role,
  side,
}: {
  name: string
  initials: string
  ready: boolean
  role: string
  side: 'you' | 'partner'
}) {
  return (
    <div className={`sg-duel-lobby__player sg-duel-lobby__player--${side}${ready ? ' is-ready' : ''}`}>
      <div className="sg-duel-lobby__avatar" aria-hidden>
        {initials}
      </div>
      <p className="sg-duel-lobby__name">{name}</p>
      <p className="sg-duel-lobby__role">{role}</p>
      <p className="sg-duel-lobby__status">{ready ? 'Ready' : 'Not ready'}</p>
    </div>
  )
}