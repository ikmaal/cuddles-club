import type { PoopHeroLine } from '../lib/poopHeroMessages'

interface PoopHeroHeadlineProps {
  lines: PoopHeroLine[]
}

export function PoopHeroHeadline({ lines }: PoopHeroHeadlineProps) {
  return (
    <h1>
      {lines.map((line, index) => (
        <span key={index}>
          {index > 0 ? <br /> : null}
          {typeof line === 'string' ? (
            line
          ) : (
            <>
              {line.before}
              <em>{line.em}</em>
              {line.after}
            </>
          )}
        </span>
      ))}
    </h1>
  )
}
