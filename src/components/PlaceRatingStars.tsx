interface PlaceRatingStarsProps {
  score: number
  className?: string
}

export function PlaceRatingStars({ score, className = '' }: PlaceRatingStarsProps) {
  const filled = Math.min(5, Math.max(0, Math.floor(score)))

  return (
    <div
      className={`place-rating-stars${className ? ` ${className}` : ''}`}
      aria-label={`${filled} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={`place-rating-stars__star${index < filled ? ' is-filled' : ''}`}
          aria-hidden
        >
          ★
        </span>
      ))}
    </div>
  )
}
