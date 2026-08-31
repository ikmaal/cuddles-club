interface CoupleRatingArtProps {
  className?: string
}

export function CoupleRatingArt({ className = '' }: CoupleRatingArtProps) {
  return (
    <svg
      className={`couple-rating-art${className ? ` ${className}` : ''}`}
      viewBox="0 0 120 100"
      aria-hidden
    >
      <circle cx="88" cy="18" r="3" fill="#d4d4d4" opacity="0.8" />
      <circle cx="102" cy="30" r="2" fill="#e5e5e5" opacity="0.7" />
      <text x="100" y="12" fontSize="8" fill="#a3a3a3">
        ✦
      </text>
      <ellipse cx="42" cy="78" rx="28" ry="8" fill="#f3f3f3" />
      <circle cx="34" cy="52" r="14" fill="#e5e5e5" />
      <circle cx="58" cy="50" r="15" fill="#d4d4d4" />
      <circle cx="30" cy="48" r="2" fill="#525252" />
      <circle cx="38" cy="48" r="2" fill="#525252" />
      <path d="M32 56q4 4 8 0" stroke="#737373" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="54" cy="46" r="2" fill="#525252" />
      <circle cx="62" cy="46" r="2" fill="#525252" />
      <path d="M56 54q4 3 8 0" stroke="#737373" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path
        d="M48 34c2-6 10-8 14-2M66 32c4-5 12-2 12 4"
        stroke="#a3a3a3"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="28" y="64" width="18" height="22" rx="8" fill="#a3a3a3" />
      <rect x="50" y="62" width="20" height="24" rx="9" fill="#737373" />
    </svg>
  )
}
