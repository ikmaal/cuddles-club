import { SERVICES } from '../services'
import { useOverscrollGuard } from '../hooks/useOverscrollGuard'
import { daysTogether } from '../hooks/useProfile'
import type { CoupleProfile, Screen } from '../types'

interface HomeScreenProps {
  profile: CoupleProfile
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

export function HomeScreen({ profile, onOpen }: HomeScreenProps) {
  const days = daysTogether(profile.since)
  const homeRef = useOverscrollGuard<HTMLDivElement>(false)

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

        {days !== null ? (
          <section className="home-section" aria-label="Days together">
            <ul className="metrics metrics--solo">
              <li className="metric">
                <span className="metric__value">{days}</span>
                <span className="metric__label">
                  {days === 1 ? 'Day together' : 'Days together'}
                </span>
              </li>
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  )
}
