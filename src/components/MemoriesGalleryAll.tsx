import { BackIcon } from './Icons'
import { ScrollRegion } from './ScrollRegion'
import type { Photostrip } from '../types'

interface MemoriesGalleryAllProps {
  strips: Photostrip[]
  onBack: () => void
  onOpen: (strip: Photostrip) => void
}

export function MemoriesGalleryAll({ strips, onBack, onOpen }: MemoriesGalleryAllProps) {
  const sorted = [...strips].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="memories-all">
      <header className="booth-subhead">
        <button type="button" className="booth-back" onClick={onBack} aria-label="Back">
          <BackIcon size={20} />
        </button>
        <h1>all strips</h1>
        <span className="booth-subhead__spacer" />
      </header>
      <ScrollRegion className="screen__scroll booth-scroll">
        {sorted.length === 0 ? (
          <p className="booth-empty">No strips yet.</p>
        ) : (
          <ul className="booth-grid">
            {sorted.map((strip) => (
              <li key={strip.id}>
                <button
                  type="button"
                  className="booth-grid__open"
                  onClick={() => onOpen(strip)}
                  aria-label={strip.title}
                >
                  <img src={strip.image} alt="" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollRegion>
    </div>
  )
}
