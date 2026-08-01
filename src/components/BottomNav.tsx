import type { Tab } from '../types'

interface BottomNavProps {
  tab: Tab
  onChange: (tab: Tab) => void
  count: number
}

export function BottomNav({ tab, onChange, count }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      <button
        type="button"
        className={`bottom-nav__item ${tab === 'map' ? 'is-active' : ''}`}
        onClick={() => onChange('map')}
        aria-current={tab === 'map' ? 'page' : undefined}
      >
        <span className="bottom-nav__icon" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M9 3v15M15 6v15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span>Map</span>
      </button>

      <button
        type="button"
        className="bottom-nav__add"
        onClick={() => onChange('add')}
        aria-label="Add a place"
        aria-current={tab === 'add' ? 'page' : undefined}
      >
        <span className="bottom-nav__add-inner" aria-hidden>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>

      <button
        type="button"
        className={`bottom-nav__item ${tab === 'list' ? 'is-active' : ''}`}
        onClick={() => onChange('list')}
        aria-current={tab === 'list' ? 'page' : undefined}
      >
        <span className="bottom-nav__icon" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M8 6h12M8 12h12M8 18h12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="4.5" cy="6" r="1.2" fill="currentColor" />
            <circle cx="4.5" cy="12" r="1.2" fill="currentColor" />
            <circle cx="4.5" cy="18" r="1.2" fill="currentColor" />
          </svg>
        </span>
        <span>Places{count > 0 ? ` · ${count}` : ''}</span>
      </button>
    </nav>
  )
}
