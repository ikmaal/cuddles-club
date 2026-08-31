import { CoupleRatingArt } from './CoupleRatingArt'
import { PlaceRating } from './PlaceRating'
import { PlaceRatingStars } from './PlaceRatingStars'
import { placeRatingAverage } from '../lib/placeRatings'
import type { PlaceRatings } from '../types'

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}

interface PlaceRatingsDuoProps {
  names: { you: string; partner: string }
  photos?: { you: string; partner: string }
  ratings: PlaceRatings
  onYouChange?: (rating: number) => void
  layout?: 'stack' | 'inline'
}

export function PlaceRatingsDuo({
  names,
  photos,
  ratings,
  onYouChange,
  layout = 'stack',
}: PlaceRatingsDuoProps) {
  const youLabel = firstName(names.you)
  const partnerLabel = firstName(names.partner)
  const average = placeRatingAverage(ratings)

  if (layout === 'inline') {
    if (ratings.you <= 0 && ratings.partner <= 0) return null
    return (
      <span className="place-ratings-inline" aria-label="Place ratings">
        {average != null ? (
          <span className="place-ratings-inline__chip place-ratings-inline__chip--avg">
            <span className="place-ratings-inline__name">Avg</span>
            <span className="place-ratings-inline__value">{average.toFixed(1)}</span>
          </span>
        ) : null}
        {ratings.you > 0 ? (
          <span className="place-ratings-inline__chip place-ratings-inline__chip--you">
            <span className="place-ratings-inline__name">You</span>
            <span className="place-ratings-inline__value">{ratings.you.toFixed(1)}</span>
          </span>
        ) : null}
        {ratings.partner > 0 ? (
          <span className="place-ratings-inline__chip">
            <span className="place-ratings-inline__name">{partnerLabel}</span>
            <span className="place-ratings-inline__value">{ratings.partner.toFixed(1)}</span>
          </span>
        ) : null}
      </span>
    )
  }

  return (
    <div className="place-ratings-page">
      {average != null ? (
        <article className="place-ratings-avg-card" aria-label={`Average rating ${average.toFixed(1)} out of 10`}>
          <div className="place-ratings-avg-card__copy">
            <h3 className="place-ratings-avg-card__title">Average Rating</h3>
            <div className="place-ratings-avg-card__scoreblock">
              <span className="place-ratings-avg-card__score">{average.toFixed(1)}</span>
              <span className="place-ratings-avg-card__max">/ 10</span>
            </div>
            <PlaceRatingStars score={average} />
          </div>
          <CoupleRatingArt className="place-ratings-avg-card__art" />
        </article>
      ) : null}

      <article className={`place-ratings-user-card${onYouChange ? ' is-editable' : ''}`}>
        <header className="place-ratings-user-card__head">
          <div className="place-ratings-user-card__title">
            <h3>Your Rating ({youLabel})</h3>
            {onYouChange ? <span className="place-ratings-user-card__badge">You</span> : null}
          </div>
        </header>
        <PlaceRating
          value={ratings.you}
          onChange={onYouChange}
          readOnly={!onYouChange}
          variant="detail"
        />
      </article>

      <article className="place-ratings-user-card place-ratings-user-card--partner">
        <header className="place-ratings-user-card__head place-ratings-user-card__head--partner">
          {photos?.partner ? (
            <img className="place-ratings-user-card__avatar" src={photos.partner} alt="" />
          ) : (
            <span className="place-ratings-user-card__avatar place-ratings-user-card__avatar--fallback">
              {partnerLabel[0]?.toUpperCase() ?? '?'}
            </span>
          )}
          <h3>{partnerLabel}&apos;s Rating</h3>
        </header>
        {ratings.partner > 0 ? (
          <PlaceRating value={ratings.partner} readOnly variant="detail" />
        ) : (
          <p className="place-ratings-user-card__waiting">
            Waiting for {partnerLabel}&apos;s score
          </p>
        )}
      </article>
    </div>
  )
}
