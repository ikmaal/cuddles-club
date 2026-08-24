import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HeartIcon } from './Icons'
import type { Photostrip } from '../types'

interface MemoriesGalleryProps {
  strips: Photostrip[]
  favorites: string[]
  ready: boolean
  onOpen: (strip: Photostrip) => void
  onToggleFavorite: (id: string) => void
  onViewAll: () => void
}

function stripCaption(strip: Photostrip): { place: string; date: string } {
  const [place] = strip.title.split(' · ')
  const date = new Date(strip.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return {
    place: (place?.trim() || strip.title).slice(0, 28),
    date: date.toUpperCase(),
  }
}

function cardOffset(index: number, active: number): number {
  return index - active
}

export function MemoriesGallery({
  strips,
  favorites,
  ready,
  onOpen,
  onToggleFavorite,
  onViewAll,
}: MemoriesGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRaf = useRef(0)

  const sorted = useMemo(
    () => [...strips].sort((a, b) => b.createdAt - a.createdAt),
    [strips],
  )

  const syncActiveFromScroll = useCallback(() => {
    const track = trackRef.current
    if (!track || sorted.length === 0) return

    const center = track.scrollLeft + track.clientWidth / 2
    let best = 0
    let bestDist = Number.POSITIVE_INFINITY

    cardRefs.current.forEach((card, index) => {
      if (!card) return
      const cardCenter = card.offsetLeft + card.offsetWidth / 2
      const dist = Math.abs(cardCenter - center)
      if (dist < bestDist) {
        bestDist = dist
        best = index
      }
    })

    setActiveIndex(best)
  }, [sorted.length])

  const scrollToIndex = useCallback((index: number, smooth = true) => {
    const track = trackRef.current
    const card = cardRefs.current[index]
    if (!track || !card) return

    const target =
      card.offsetLeft - track.clientWidth / 2 + card.offsetWidth / 2

    track.scrollTo({
      left: target,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }, [])

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, sorted.length)
    if (sorted.length === 0) {
      setActiveIndex(0)
      return
    }
    if (activeIndex > sorted.length - 1) {
      setActiveIndex(sorted.length - 1)
    }
  }, [sorted.length, activeIndex])

  useEffect(() => {
    if (sorted.length === 0) return
    const id = window.requestAnimationFrame(() => scrollToIndex(0, false))
    return () => window.cancelAnimationFrame(id)
  }, [sorted.length, scrollToIndex])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const onScroll = () => {
      window.cancelAnimationFrame(scrollRaf.current)
      scrollRaf.current = window.requestAnimationFrame(syncActiveFromScroll)
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    syncActiveFromScroll()

    return () => {
      track.removeEventListener('scroll', onScroll)
      window.cancelAnimationFrame(scrollRaf.current)
    }
  }, [syncActiveFromScroll, sorted.length])

  const countLabel = sorted.length === 1 ? '1 strip' : `${sorted.length} strips`

  return (
    <section className="memories" aria-label="Memories">
      <header className="memories__head">
        <div>
          <h2 className="memories__title">memories ♡</h2>
          <p className="memories__count">{ready ? countLabel : 'Opening album…'}</p>
        </div>
        <button
          type="button"
          className="memories__view-all"
          onClick={onViewAll}
          disabled={!ready || sorted.length === 0}
        >
          view all
        </button>
      </header>

      {sorted.length === 0 ? (
        <div className="memories__empty">
          <p>{ready ? 'Add your first strip to start the gallery.' : 'Opening album…'}</p>
        </div>
      ) : (
        <div className="memories__stage">
          <div className="memories__track" ref={trackRef}>
            {sorted.map((strip, index) => {
              const offset = cardOffset(index, activeIndex)
              const { place, date } = stripCaption(strip)
              const favorited = favorites.includes(strip.id)
              const absOffset = Math.abs(offset)
              const clamped = Math.min(absOffset, 3)

              return (
                <div
                  key={strip.id}
                  ref={(node) => {
                    cardRefs.current[index] = node
                  }}
                  className={`memories-card${offset === 0 ? ' is-active' : ''}${offset < 0 ? ' is-before' : ''}${offset > 0 ? ' is-after' : ''}`}
                  style={
                    {
                      '--card-offset': offset,
                      '--card-depth': clamped,
                    } as React.CSSProperties
                  }
                >
                  <button
                    type="button"
                    className="memories-card__hit"
                    onClick={() => {
                      if (offset !== 0) {
                        scrollToIndex(index)
                        return
                      }
                      onOpen(strip)
                    }}
                    aria-label={`${place}, ${date}`}
                  >
                    <span className="memories-card__frame">
                      <img src={strip.image} alt="" draggable={false} />
                    </span>
                  </button>
                  <span className="memories-card__meta">
                    <span className="memories-card__copy">
                      <span className="memories-card__date">{date}</span>
                      <span className="memories-card__place">{place}</span>
                    </span>
                    <button
                      type="button"
                      className={`memories-card__heart${favorited ? ' is-faved' : ''}`}
                      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
                      onClick={() => onToggleFavorite(strip.id)}
                    >
                      <HeartIcon size={16} />
                    </button>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
