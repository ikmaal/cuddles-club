import { averageRating, formatDate } from '../storage'
import { wouldReturnLabel } from '../lib/geo'
import type { CoupleProfile, Place } from '../types'
import { Logo } from './Logo'
import { StarRating } from './StarRating'

interface PlaceListProps {
  places: Place[]
  profile: CoupleProfile
  query: string
  onQueryChange: (value: string) => void
  onSelect: (id: string) => void
  onAdd: () => void
}

export function PlaceList({
  places,
  profile,
  query,
  onQueryChange,
  onSelect,
  onAdd,
}: PlaceListProps) {
  const filtered = places.filter((place) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      place.name.toLowerCase().includes(q) ||
      place.cuisine.toLowerCase().includes(q) ||
      place.note.toLowerCase().includes(q) ||
      (place.address?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <div className="list-view">
      <div className="list-view__search">
        <label className="sr-only" htmlFor="place-search">
          Search places
        </label>
        <input
          id="place-search"
          type="search"
          placeholder="Search by name, cuisine, note…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          autoComplete="off"
        />
      </div>

      {places.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__orb" aria-hidden>
            <Logo size={56} />
          </div>
          <h2>Your map is waiting</h2>
          <p>
            Log the cafés, stalls, and date-night spots you’ve shared. Start with
            your latest meal together.
          </p>
          <button type="button" className="btn btn--primary" onClick={onAdd}>
            Add your first place
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state empty-state--compact">
          <h2>No matches</h2>
          <p>Try another name or cuisine.</p>
        </div>
      ) : (
        <ul className="place-list">
          {filtered.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                className="place-card"
                onClick={() => onSelect(place.id)}
              >
                <div className="place-card__top">
                  <div>
                    <h3>{place.name}</h3>
                    <p className="place-card__meta">
                      {place.cuisine} · {formatDate(place.visitedAt)}
                    </p>
                  </div>
                  <div className="place-card__score">
                    <span>{averageRating(place).toFixed(1)}</span>
                    <small>avg</small>
                  </div>
                </div>
                <div className="place-card__ratings">
                  <StarRating
                    value={place.ratingYou}
                    readOnly
                    size="sm"
                    label={profile.nameYou}
                  />
                  <StarRating
                    value={place.ratingPartner}
                    readOnly
                    size="sm"
                    label={profile.namePartner}
                  />
                </div>
                {place.note ? (
                  <p className="place-card__note">“{place.note}”</p>
                ) : null}
                <span
                  className={`return-chip return-chip--${place.wouldReturn}`}
                >
                  {wouldReturnLabel(place.wouldReturn)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
