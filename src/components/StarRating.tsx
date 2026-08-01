interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
  label?: string
  readOnly?: boolean
}

export function StarRating({
  value,
  onChange,
  size = 'md',
  label,
  readOnly = false,
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5]

  return (
    <div className={`star-rating star-rating--${size}`}>
      {label ? <span className="star-rating__label">{label}</span> : null}
      <div className="star-rating__stars" role={readOnly ? 'img' : 'group'} aria-label={label ?? 'Rating'}>
        {stars.map((star) => {
          const filled = star <= value
          if (readOnly) {
            return (
              <span
                key={star}
                className={`star ${filled ? 'star--filled' : ''}`}
                aria-hidden
              >
                ★
              </span>
            )
          }
          return (
            <button
              key={star}
              type="button"
              className={`star star--btn ${filled ? 'star--filled' : ''}`}
              onClick={() => onChange?.(star)}
              aria-label={`${star} star${star === 1 ? '' : 's'}`}
              aria-pressed={filled}
            >
              ★
            </button>
          )
        })}
      </div>
    </div>
  )
}
