import { forwardRef, useCallback, useId, useImperativeHandle, useRef, useState } from 'react'
import {
  clampPlaceRating,
  PLACE_RATING_MAX,
  PLACE_RATING_STEP,
  ratingEmoji,
  ratingVibe,
} from '../lib/placeRating'

export interface PlaceRatingHandle {
  focusSlider: () => void
}

interface PlaceRatingProps {
  value: number
  onChange?: (value: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'detail'
  className?: string
}

export const PlaceRating = forwardRef<PlaceRatingHandle, PlaceRatingProps>(function PlaceRating(
  {
    value,
    onChange,
    readOnly = false,
    size = 'md',
    variant = 'default',
    className = '',
  },
  ref,
) {
  const rating = clampPlaceRating(value)
  const interactive = !readOnly && Boolean(onChange)
  const trackRef = useRef<HTMLDivElement>(null)
  const rangeRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const hint = ratingVibe(rating)
  const emoji = ratingEmoji(rating)
  const percent = (rating / PLACE_RATING_MAX) * 100
  const [dragging, setDragging] = useState(false)

  useImperativeHandle(ref, () => ({
    focusSlider: () => {
      rangeRef.current?.focus()
    },
  }))

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

  const endDrag = (target: HTMLElement, pointerId: number) => {
    if (target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId)
    }
    setDragging(false)
  }

  const slider = (
    <div
      className={`place-rating__track-wrap${dragging ? ' is-dragging' : ''}${
        variant === 'detail' ? ' place-rating__track-wrap--detail' : ''
      }${readOnly ? ' is-readonly' : ''}`}
      onPointerDown={
        interactive
          ? (event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              setDragging(true)
              setFromClientX(event.clientX)
            }
          : undefined
      }
      onPointerMove={
        interactive
          ? (event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
              setFromClientX(event.clientX)
            }
          : undefined
      }
      onPointerUp={
        interactive
          ? (event) => {
              endDrag(event.currentTarget, event.pointerId)
            }
          : undefined
      }
      onPointerCancel={
        interactive
          ? (event) => {
              endDrag(event.currentTarget, event.pointerId)
            }
          : undefined
      }
    >
      <label className="sr-only" htmlFor={inputId}>
        Rating out of 10
      </label>
      <input
        ref={rangeRef}
        id={inputId}
        className="place-rating__range"
        type="range"
        min={0}
        max={PLACE_RATING_MAX}
        step={PLACE_RATING_STEP}
        value={rating}
        disabled={readOnly}
        onChange={(event) => onChange?.(clampPlaceRating(Number(event.target.value)))}
        onPointerDown={() => {
          if (!readOnly) setDragging(true)
        }}
        onPointerUp={() => setDragging(false)}
      />
      <div ref={trackRef} className="place-rating__track">
        <span className="place-rating__track-fill" style={{ width: `${percent}%` }} />
        {variant === 'detail' ? (
          <>
            <span className="place-rating__tick" style={{ left: '0%' }} />
            <span className="place-rating__tick" style={{ left: '50%' }} />
            <span className="place-rating__tick" style={{ left: '100%' }} />
          </>
        ) : null}
        <span className="place-rating__thumb" style={{ left: `${percent}%` }}>
          {variant === 'detail' && rating > 0 ? (
            <span className="place-rating__thumb-label">{rating.toFixed(1)}</span>
          ) : null}
        </span>
      </div>
      <div className="place-rating__scale" aria-hidden>
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  )

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

  if (variant === 'detail') {
    return (
      <div
        className={`place-rating place-rating--detail${
          interactive ? ' is-interactive' : ' is-readonly'
        }${className ? ` ${className}` : ''}`}
      >
        <div className="place-rating-detail__body">
          <div className="place-rating-detail__score-col">
            <div className="place-rating-detail__scoreblock">
              <span className="place-rating-detail__score" aria-live={interactive ? 'polite' : 'off'}>
                {rating > 0 ? rating.toFixed(1) : '—'}
              </span>
              <span className="place-rating-detail__max">/ 10</span>
            </div>
            {rating > 0 ? (
              <p className="place-rating-detail__vibe">
                <span className="place-rating-detail__emoji" aria-hidden>
                  {emoji}
                </span>
                {hint}
              </p>
            ) : (
              <p className="place-rating-detail__vibe place-rating-detail__vibe--empty">{hint}</p>
            )}
          </div>
          <div className="place-rating-detail__slider-col">
            {interactive || rating > 0 ? (
              slider
            ) : (
              <p className="place-rating-detail__empty">Not rated yet</p>
            )}
          </div>
        </div>
      </div>
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
          {slider}
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
})
