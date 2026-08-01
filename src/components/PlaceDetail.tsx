import { averageRating, formatDate } from '../storage'
import { wouldReturnLabel } from '../lib/geo'
import type { CoupleProfile, Place } from '../types'
import { StarRating } from './StarRating'

interface PlaceDetailProps {
  place: Place
  profile: CoupleProfile
  onClose: () => void
  onDelete: (id: string) => void
  onShowOnMap: (id: string) => void
}

export function PlaceDetail({
  place,
  profile,
  onClose,
  onDelete,
  onShowOnMap,
}: PlaceDetailProps) {
  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <aside
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__handle" aria-hidden />
        <header className="sheet__header">
          <div>
            <p className="eyebrow">{place.cuisine}</p>
            <h2 id="place-detail-title">{place.name}</h2>
            <p className="sheet__sub">
              Visited {formatDate(place.visitedAt)} · avg{' '}
              {averageRating(place).toFixed(1)}★
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        {place.address ? (
          <p className="sheet__address">{place.address}</p>
        ) : null}

        <div className="sheet__ratings">
          <StarRating
            value={place.ratingYou}
            readOnly
            label={profile.nameYou}
          />
          <StarRating
            value={place.ratingPartner}
            readOnly
            label={profile.namePartner}
          />
        </div>

        <div className="sheet__block">
          <span className={`return-chip return-chip--${place.wouldReturn}`}>
            {wouldReturnLabel(place.wouldReturn)}
          </span>
        </div>

        {place.note ? (
          <blockquote className="sheet__note">“{place.note}”</blockquote>
        ) : null}

        <div className="sheet__actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => onShowOnMap(place.id)}
          >
            Show on map
          </button>
          <button
            type="button"
            className="btn btn--ghost-danger"
            onClick={() => {
              if (
                window.confirm(
                  `Remove ${place.name} from your shared map? This can’t be undone.`,
                )
              ) {
                onDelete(place.id)
              }
            }}
          >
            Remove
          </button>
        </div>
      </aside>
    </div>
  )
}
