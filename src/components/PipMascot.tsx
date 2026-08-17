import type { PipMood } from '../lib/studyAgent'

interface PipMascotProps {
  mood?: PipMood
  size?: number
  speaking?: boolean
  onClick?: () => void
  label?: string
}

export function PipMascot({
  mood = 'idle',
  size = 72,
  speaking = false,
  onClick,
  label = 'Chat with Pip',
}: PipMascotProps) {
  const className = `pip pip--${mood}${speaking ? ' is-speaking' : ''}${onClick ? ' is-button' : ''}`
  const style = { width: size, height: size }
  const body = (
    <>
      <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden>
        <ellipse cx="40" cy="72" rx="18" ry="4" fill="rgba(91,124,110,0.18)" />
        <path
          className="pip__leaf"
          d="M40 14c0 0 2-8 10-10-1 8-5 12-10 14-5-2-9-6-10-14 8 2 10 10 10 10z"
          fill="#7fad95"
        />
        <circle className="pip__body" cx="40" cy="44" r="24" fill="#5b7c6e" />
        <circle cx="40" cy="46" r="18" fill="#6f917f" opacity="0.35" />
        <g className="pip__face">
          <ellipse className="pip__eye" cx="32" cy="42" rx="3.2" ry="4" fill="#1a1a1a" />
          <ellipse className="pip__eye" cx="48" cy="42" rx="3.2" ry="4" fill="#1a1a1a" />
          <circle cx="33.2" cy="40.8" r="1" fill="#fff" />
          <circle cx="49.2" cy="40.8" r="1" fill="#fff" />
          <path
            className="pip__smile"
            d="M33 50c2.4 3.2 11.6 3.2 14 0"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="27" cy="48" r="3" fill="#d9a39a" opacity="0.55" />
          <circle cx="53" cy="48" r="3" fill="#d9a39a" opacity="0.55" />
        </g>
        <g className="pip__book">
          <rect x="52" y="50" width="16" height="12" rx="2" fill="#f7f1e6" stroke="#3d5348" strokeWidth="1.2" />
          <path d="M60 50v12" stroke="#3d5348" strokeWidth="1.2" />
          <path d="M55 54h4M55 57h4" stroke="#5b7c6e" strokeWidth="1.1" strokeLinecap="round" />
        </g>
      </svg>
      {speaking ? (
        <span className="pip__dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
      ) : null}
    </>
  )

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-label={label} style={style}>
        {body}
      </button>
    )
  }

  return (
    <div className={className} style={style}>
      {body}
    </div>
  )
}
