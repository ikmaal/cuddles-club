import { useEffect, useState } from 'react'
import { PauseIcon, PlayIcon, SpotifyIcon } from './Icons'
import type { ListeningCard } from '../types'

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function liveProgressMs(card: ListeningCard, tick: number): number | null {
  if (card.progressMs == null || card.durationMs == null) return card.progressMs
  if (!card.isPlaying) return card.progressMs
  const elapsed = card.progressMs + Math.max(0, tick - card.updatedAt)
  return Math.min(card.durationMs, elapsed)
}

export function HomeListeningCard({
  card,
  memberPhoto,
  onConnect,
}: {
  card: ListeningCard
  memberPhoto: string
  onConnect?: () => void
}) {
  const [tick, setTick] = useState(() => Date.now())

  useEffect(() => {
    if (!card.isPlaying) return
    const id = window.setInterval(() => setTick(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [card.isPlaying, card.updatedAt])

  const isPartner = card.who === 'partner'
  const shortName = card.name.trim().split(/\s+/)[0] || card.name
  const memberInitial = shortName[0]?.toUpperCase() ?? '?'
  const hasTrack = Boolean(card.trackName)
  const playing = hasTrack && card.isPlaying
  const statusLabel = playing ? 'Listening now' : hasTrack ? 'Recently played' : shortName

  const title = card.trackName
    ? card.trackName
    : card.connected
      ? 'Quiet for now'
      : isPartner
        ? 'Waiting to connect'
        : 'Connect Spotify'

  const artists = hasTrack
    ? card.artists || shortName
    : card.connected
      ? 'Open Spotify to start listening'
      : isPartner
        ? 'Connect in Us → Settings'
        : 'Tap to connect in Settings'

  const progressMs = liveProgressMs(card, tick)
  const durationMs = card.durationMs
  const showProgress = playing && progressMs != null && durationMs != null && durationMs > 0
  const progressRatio = showProgress ? Math.min(1, progressMs / durationMs) : 0

  const className = [
    'home-listening',
    playing ? 'is-playing' : '',
    hasTrack && !playing ? 'is-recent' : '',
    !hasTrack ? 'is-idle' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const body = (
    <>
      <span className="home-listening__art-wrap">
        {card.albumArtUrl ? (
          <img className="home-listening__art" src={card.albumArtUrl} alt="" />
        ) : (
          <span className="home-listening__art home-listening__art--empty" aria-hidden>
            ♪
          </span>
        )}
        <span className="home-listening__spotify-badge" aria-hidden>
          <SpotifyIcon size={10} />
        </span>
      </span>

      <div className="home-listening__main">
        <div className="home-listening__header">
          <span className="home-listening__status">
            <span className="home-listening__member-avatar" aria-hidden>
              {memberPhoto ? (
                <img src={memberPhoto} alt="" />
              ) : (
                <span>{memberInitial}</span>
              )}
            </span>
            <span>{statusLabel}</span>
          </span>
          {playing ? (
            <span className="home-listening__viz" aria-hidden>
              <i />
              <i />
              <i />
              <i />
            </span>
          ) : null}
        </div>

        <strong className="home-listening__title">{title}</strong>
        <p className="home-listening__artists">{artists}</p>

        {showProgress ? (
          <div className="home-listening__progress-block">
            <div
              className="home-listening__progress"
              role="progressbar"
              aria-valuenow={Math.round(progressRatio * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${progressRatio * 100}%` }} />
            </div>
            <div className="home-listening__times">
              <span>{formatTime(progressMs)}</span>
              <span>{formatTime(durationMs)}</span>
            </div>
          </div>
        ) : null}
      </div>

      {hasTrack ? (
        <span className="home-listening__control" aria-hidden>
          {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        </span>
      ) : null}
    </>
  )

  if (card.trackUrl) {
    return (
      <a className={className} href={card.trackUrl} target="_blank" rel="noreferrer">
        {body}
      </a>
    )
  }

  if (!card.connected && onConnect) {
    return (
      <button type="button" className={className} onClick={onConnect}>
        {body}
      </button>
    )
  }

  return <div className={className}>{body}</div>
}
