import { useRef, useState } from 'react'
import { HomePhotoCropSheet } from '../components/HomePhotoCropSheet'
import { SERVICES } from '../services'
import { useSpotifyListening } from '../context/SpotifyListeningContext'
import { useHomePhoto } from '../hooks/useHomePhoto'
import { useOverscrollGuard } from '../hooks/useOverscrollGuard'
import { daysTogether } from '../hooks/useProfile'
import { formatRelative } from '../hooks/useStored'
import type { CoupleProfile, ListeningCard, Photostrip, Screen } from '../types'

interface HomeScreenProps {
  profile: CoupleProfile
  latestStrip: Photostrip | null
  onOpen: (screen: Screen) => void
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Still up?'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function initials(profile: CoupleProfile): string {
  const a = profile.nameYou.trim()[0] ?? 'Y'
  const b = profile.namePartner.trim()[0] ?? 'P'
  return `${a}${b}`.toUpperCase()
}

function ListeningRow({
  card,
  onConnect,
}: {
  card: ListeningCard
  onConnect?: () => void
}) {
  const isPartner = card.who === 'partner'
  const shortName = card.name.trim().split(/\s+/)[0] || card.name
  const hasTrack = Boolean(card.trackName)
  const statusLabel = card.isPlaying ? 'Listening now' : 'Recently played'
  const title = card.trackName
    ? card.trackName
    : card.connected
      ? 'Quiet for now'
      : isPartner
        ? 'Waiting'
        : 'Connect'
  const subtitle = hasTrack
    ? [shortName, card.artists].filter(Boolean).join(' · ')
    : card.connected
      ? shortName
      : isPartner
        ? 'Us tab'
        : 'Spotify'

  const className = [
    'home-activity',
    'home-listening',
    card.isPlaying ? 'is-playing' : '',
    hasTrack && !card.isPlaying ? 'is-recent' : '',
    !hasTrack ? 'is-idle' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const body = (
    <>
      {card.albumArtUrl ? (
        <img className="home-listening__art" src={card.albumArtUrl} alt="" />
      ) : (
        <span className="home-listening__art home-listening__art--empty" aria-hidden>
          ♪
        </span>
      )}
      <span className="home-listening__copy">
        <span className="home-listening__eyebrow">
          {hasTrack ? statusLabel : shortName}
        </span>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
      {card.isPlaying ? (
        <span className="home-listening__eq" aria-label="Playing">
          <i />
          <i />
          <i />
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

export function HomeScreen({ profile, latestStrip, onOpen }: HomeScreenProps) {
  const days = daysTogether(profile.since)
  const homeRef = useOverscrollGuard<HTMLDivElement>(true)
  const { photo, photoKey, busy, saveDataUrl } = useHomePhoto()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const photoBtnRef = useRef<HTMLButtonElement>(null)
  const spotify = useSpotifyListening()
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropAspect, setCropAspect] = useState(2.6)

  function closeCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  function onPhotoPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !file.type.startsWith('image/')) return

    const button = photoBtnRef.current
    if (button && button.clientWidth > 0 && button.clientHeight > 0) {
      setCropAspect(button.clientWidth / button.clientHeight)
    } else {
      setCropAspect(days === null ? 16 / 9 : 2.6)
    }

    setCropSrc(URL.createObjectURL(file))
  }

  return (
    <div className="home" ref={homeRef}>
      <header className="home__top">
        <span className="home__mark" aria-hidden>
          <img
            src={`${import.meta.env.BASE_URL}favicon.jpg`}
            alt=""
            width={40}
            height={40}
          />
        </span>
        <div className="home__greet">
          <p className="home__hello">{greeting()}</p>
          <h1>
            {profile.nameYou} & {profile.namePartner}
          </h1>
        </div>
        <button
          type="button"
          className="home__avatar"
          onClick={() => onOpen('us')}
          aria-label="Open our profile"
        >
          {initials(profile)}
        </button>
      </header>

      <div className="home__scroll">
        <section className="surface services services--solo" aria-label="Things you can do">
          <ul className="services__grid services__grid--solo">
            {SERVICES.map((service) => (
              <li key={service.id}>
                <button
                  type="button"
                  className="service"
                  onClick={() => onOpen(service.id)}
                >
                  <span
                    className={`service__tile service__tile--${service.tone}${
                      service.image ? ' service__tile--image' : ''
                    }`}
                  >
                    {service.image ? (
                      <img
                        src={`${import.meta.env.BASE_URL}${service.image}`}
                        alt=""
                      />
                    ) : (
                      <service.Icon size={26} />
                    )}
                  </span>
                  <span className="service__label">{service.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section
          className={`home-duo${days === null ? ' home-duo--photo-only' : ''}`}
          aria-label="Together"
        >
          {days !== null ? (
            <div className="metric home-duo__metric">
              <span className="metric__value">{days}</span>
              <span className="metric__label">
                {days === 1 ? 'Day together' : 'Days together'}
              </span>
            </div>
          ) : null}

          <button
            ref={photoBtnRef}
            type="button"
            className={`home-photo${photo ? ' has-image' : ''}`}
            onClick={() => photoInputRef.current?.click()}
            disabled={busy || Boolean(cropSrc)}
            aria-label={photo ? 'Change home photo' : 'Add a home photo'}
          >
            {photo ? (
              <img key={photoKey} src={photo} alt="" />
            ) : (
              <span className="home-photo__empty">
                <span className="home-photo__plus" aria-hidden>
                  +
                </span>
                <span>{busy ? 'Saving…' : 'Add photo'}</span>
              </span>
            )}
          </button>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onPhotoPicked}
          />
        </section>

        <section className="home-section home-lately" aria-label="Activities">
          <div className="section-head section-head--tight">
            <h2>Activities</h2>
          </div>

          <div className="home-lately__row">
            {latestStrip ? (
              <button
                type="button"
                className="home-activity home-activity--strip"
                onClick={() => onOpen('strips')}
              >
                <img
                  className="home-activity__strip"
                  src={latestStrip.image}
                  alt=""
                />
                <span className="home-activity__copy">
                  <span className="home-activity__eyebrow">Photobooth</span>
                  <strong>{latestStrip.title}</strong>
                  <small>{formatRelative(latestStrip.createdAt)}</small>
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="home-activity home-activity--strip home-activity--empty"
                onClick={() => onOpen('strips')}
              >
                <span className="home-activity__copy">
                  <span className="home-activity__eyebrow">Photobooth</span>
                  <strong>Nothing developed yet</strong>
                  <small>Open the booth for your first strip</small>
                </span>
              </button>
            )}

            <div className="home-listening-list" aria-label="Listening">
              <ListeningRow
                card={spotify.you}
                onConnect={
                  spotify.configured && !spotify.connected
                    ? () => onOpen('us')
                    : undefined
                }
              />
              <ListeningRow card={spotify.partner} />
            </div>
          </div>
        </section>
      </div>

      {cropSrc ? (
        <HomePhotoCropSheet
          src={cropSrc}
          aspectRatio={cropAspect}
          busy={busy}
          onCancel={closeCrop}
          onConfirm={async (dataUrl) => {
            await saveDataUrl(dataUrl)
            closeCrop()
          }}
        />
      ) : null}
    </div>
  )
}
