import { useCallback, useId, useRef } from 'react'
import {
  clampPlaceRating,
  PLACE_RATING_MAX,
  PLACE_RATING_STEP,
  ratingVibe,
} from '../lib/placeRating'

interface PlaceRatingProps {
  value: number
  onChange?: (value: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PlaceRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  className = '',
}: PlaceRatingProps) {
  const rating = clampPlaceRating(value)
  const interactive = !readOnly && Boolean(onChange)
  const trackRef = useRef<HTMLDivElement>(null)
  const inputId = useId()
  const hint = ratingVibe(rating)
  const percent = (rating / PLACE_RATING_MAX) * 100

  const setFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track || !onChange) return
      const rect = track.getBoundingClientRect()
      if (rect.width <= 0) return
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      onChange(clampPlaceRating(ratio * PLACE_RATING_MAX))
    },
    [onChange],
  )

  const bump = (delta: number) => {
    onChange?.(clampPlaceRating(rating + delta))
  }

  if (readOnly && size === 'sm') {
    if (rating <= 0) return null
    return (
      <span
        className={`place-rating place-rating--sm${className ? ` ${className}` : ''}`}
        aria-label={`Rated ${rating.toFixed(1)} out of 10`}
      >
        <span className="place-rating__badge">{rating.toFixed(1)}</span>
      </span>
    )
  }

  return (
    <div
      className={`place-rating place-rating--${size}${
        interactive ? ' is-interactive' : ' is-readonly'
      }${className ? ` ${className}` : ''}`}
    >
      <div className="place-rating__header">
        <div className="place-rating__scoreblock">
          <span className="place-rating__score" aria-live={interactive ? 'polite' : 'off'}>
            {rating > 0 ? rating.toFixed(1) : '—'}
          </span>
          <span className="place-rating__max">/ 10</span>
        </div>

        {interactive ? (
          <div className="place-rating__stepper">
            <button
              type="button"
              className="place-rating__step"
              onClick={() => bump(-PLACE_RATING_STEP)}
              disabled={rating <= 0}
              aria-label="Decrease rating by 0.1"
            >
              −
            </button>
            <button
              type="button"
              className="place-rating__step"
              onClick={() => bump(PLACE_RATING_STEP)}
              disabled={rating >= PLACE_RATING_MAX}
              aria-label="Increase rating by 0.1"
            >
              +
            </button>
          </div>
        ) : null}
      </div>

      {interactive ? (
        <div className="place-rating__controls">
          <div className="place-rating__track-wrap">
            <label className="sr-only" htmlFor={inputId}>
              Rating out of 10
            </label>
            <input
              id={inputId}
              className="place-rating__range"
              type="range"
              min={0}
              max={PLACE_RATING_MAX}
              step={PLACE_RATING_STEP}
              value={rating}
              onChange={(event) => onChange?.(clampPlaceRating(Number(event.target.value)))}
            />
            <div
              ref={trackRef}
              className="place-rating__track"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                setFromClientX(event.clientX)
              }}
              onPointerMove={(event) => {
                if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
                setFromClientX(event.clientX)
              }}
              onPointerUp={(event) => {
                event.currentTarget.releasePointerCapture(event.pointerId)
              }}
              onPointerCancel={(event) => {
                event.currentTarget.releasePointerCapture(event.pointerId)
              }}
            >
              <span className="place-rating__track-fill" style={{ width: `${percent}%` }} />
              <span className="place-rating__thumb" style={{ left: `${percent}%` }} />
            </div>
            <div className="place-rating__scale" aria-hidden>
              <span>0</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
          <p className="place-rating__hint">{hint}</p>
        </div>
      ) : (
        <div className="place-rating__readonly">
          {rating > 0 ? (
            <div className="place-rating__meter" aria-hidden>
              <span className="place-rating__meter-fill" style={{ width: `${percent}%` }} />
            </div>
          ) : (
            <p className="place-rating__hint place-rating__hint--empty">Not rated yet</p>
          )}
        </div>
      )}
    </div>
  )
}
