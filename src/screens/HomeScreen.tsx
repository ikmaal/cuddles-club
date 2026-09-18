import { HomeListeningCard } from '../components/HomeListeningCard'
import { HomePolaroidSection } from '../components/HomePolaroidSection'
import { SERVICES } from '../services'
import { useSpotifyListening } from '../context/SpotifyListeningContext'
import { useOverscrollGuard } from '../hooks/useOverscrollGuard'
import { formatRelative } from '../hooks/useStored'
import type { CoupleProfile, Photostrip, Screen } from '../types'

interface HomeScreenProps {
  profile: CoupleProfile
  latestStrip: Photostrip | null
  onOpen: (screen: Screen) => void
  polaroidSceneryEditing: boolean
  onPolaroidSceneryEditingChange: (editing: boolean) => void
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

export function HomeScreen({
  profile,
  latestStrip,
  onOpen,
  polaroidSceneryEditing,
  onPolaroidSceneryEditingChange,
}: HomeScreenProps) {
  const homeRef = useOverscrollGuard<HTMLDivElement>(true)
  const spotify = useSpotifyListening()

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
        <HomePolaroidSection
          since={profile.since}
          editingScenery={polaroidSceneryEditing}
          onEditingSceneryChange={onPolaroidSceneryEditingChange}
        />

        <section className="services services--apps" aria-label="Things you can do">
          <ul className="services__grid services__grid--apps">
            {SERVICES.map((service) => (
              <li key={service.id}>
                <button
                  type="button"
                  className="service"
                  onClick={() => onOpen(service.id)}
                >
                  <span
                    className={`service__tile service__tile--bare${
                      service.image ? ' service__tile--image' : ` service__tile--${service.tone}`
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

        <section className="home-section home-lately" aria-label="Activities">
          <div className="section-head section-head--tight">
            <h2>Activities</h2>
          </div>

          <div className="home-lately__scroller">
            <div className="home-lately__track">
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
              <HomeListeningCard
                card={spotify.you}
                memberPhoto={profile.you.photo}
                onConnect={
                  spotify.configured && !spotify.connected
                    ? () => onOpen('us')
                    : undefined
                }
              />
              <HomeListeningCard card={spotify.partner} memberPhoto={profile.partner.photo} />
            </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
