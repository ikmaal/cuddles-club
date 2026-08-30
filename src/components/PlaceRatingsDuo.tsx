import { PlaceRating } from './PlaceRating'
import { placeRatingAverage } from '../lib/placeRatings'
import type { PlaceRatings } from '../types'

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}

interface PlaceRatingsDuoProps {
  names: { you: string; partner: string }
  ratings: PlaceRatings
  onYouChange?: (rating: number) => void
  layout?: 'stack' | 'inline'
}

export function PlaceRatingsDuo({
  names,
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
    <div className="place-ratings-duo">
      {average != null ? (
        <div className="place-ratings-average" aria-label={`Average rating ${average.toFixed(1)} out of 10`}>
          <div className="place-ratings-average__head">
            <span className="place-ratings-average__label">Average</span>
            <div className="place-ratings-average__scoreblock">
              <span className="place-ratings-average__score">{average.toFixed(1)}</span>
              <span className="place-ratings-average__max">/ 10</span>
            </div>
          </div>
          <div className="place-ratings-average__meter" aria-hidden>
            <span
              className="place-ratings-average__meter-fill"
              style={{ width: `${(average / 10) * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      <article className={`place-rating-card${onYouChange ? ' is-editable' : ''}`}>
        <header className="place-rating-card__head">
          <div className="place-rating-card__title">
            <span className="place-rating-card__label">Rated by {youLabel}</span>
            {onYouChange ? <span className="place-rating-card__tag">You</span> : null}
          </div>
        </header>
        <PlaceRating
          value={ratings.you}
          onChange={onYouChange}
          readOnly={!onYouChange}
          size="lg"
        />
      </article>

      <article className="place-rating-card place-rating-card--partner">
        <header className="place-rating-card__head">
          <div className="place-rating-card__title">
            <span className="place-rating-card__label">Rated by {partnerLabel}</span>
          </div>
        </header>
        {ratings.partner > 0 ? (
          <PlaceRating value={ratings.partner} readOnly size="md" />
        ) : (
          <p className="place-rating-card__waiting">
            Waiting for {partnerLabel}&apos;s score
          </p>
        )}
      </article>
    </div>
  )
}
