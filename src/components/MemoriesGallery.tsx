import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { Photostrip } from '../types'

interface MemoriesGalleryProps {
  strips: Photostrip[]
  ready: boolean
  onOpen: (strip: Photostrip) => void
  onViewAll: () => void
}

const FOCUS_OPEN_THRESHOLD = 0.82

export function MemoriesGallery({
  strips,
  ready,
  onOpen,
  onViewAll,
}: MemoriesGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const spotlightRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const focusRef = useRef<number[]>([])
  const scrollRaf = useRef(0)

  const sorted = useMemo(
    () => [...strips].sort((a, b) => b.createdAt - a.createdAt),
    [strips],
  )

  const updateCarousel = useCallback(() => {
    const track = trackRef.current
    if (!track || sorted.length === 0) return

    const center = track.scrollLeft + track.clientWidth / 2
    const cardWidth = cardRefs.current.find((card) => card)?.offsetWidth ?? 100
    const focusRadius = cardWidth * 1.35

    let bestFocus = -1
    let spotlightX = track.clientWidth / 2
    let spotlightFocus = 0

    const nextFocus: number[] = []

    cardRefs.current.forEach((card, index) => {
      if (!card) return

      const cardCenter = card.offsetLeft + card.offsetWidth / 2
      const signedOffset = (cardCenter - center) / cardWidth
      const dist = Math.abs(cardCenter - center)
      const focus = Math.max(0, 1 - dist / focusRadius)

      nextFocus[index] = focus
      card.style.setProperty('--focus', focus.toFixed(3))
      card.style.setProperty('--card-offset', signedOffset.toFixed(3))

      if (focus > bestFocus) {
        bestFocus = focus
        spotlightX = cardCenter - track.scrollLeft
        spotlightFocus = focus
      }
    })

    focusRef.current = nextFocus

    const spotlight = spotlightRef.current
    if (spotlight) {
      spotlight.style.setProperty('--spotlight-x', `${spotlightX}px`)
      spotlight.style.setProperty('--spotlight-focus', spotlightFocus.toFixed(3))
    }
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
    focusRef.current = focusRef.current.slice(0, sorted.length)
  }, [sorted.length])

  useEffect(() => {
    if (sorted.length === 0) return
    const id = window.requestAnimationFrame(() => {
      scrollToIndex(0, false)
      window.requestAnimationFrame(updateCarousel)
    })
    return () => window.cancelAnimationFrame(id)
  }, [sorted.length, scrollToIndex, updateCarousel])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const onScroll = () => {
      window.cancelAnimationFrame(scrollRaf.current)
      scrollRaf.current = window.requestAnimationFrame(updateCarousel)
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    updateCarousel()

    const onResize = () => updateCarousel()
    window.addEventListener('resize', onResize)

    return () => {
      track.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.cancelAnimationFrame(scrollRaf.current)
    }
  }, [updateCarousel, sorted.length])

  const countLabel = sorted.length === 1 ? '1 strip' : `${sorted.length} strips`

  return (
    <section className="memories" aria-label="Memories">
      <header className="memories__head">
        <div>
          <h2 className="memories__title">memories</h2>
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
          <div className="memories__spotlight" ref={spotlightRef} aria-hidden />
          <div className="memories__track" ref={trackRef}>
            {sorted.map((strip, index) => (
                <div
                  key={strip.id}
                  ref={(node) => {
                    cardRefs.current[index] = node
                  }}
                  className="memories-card"
                  style={
                    {
                      '--focus': 0,
                      '--card-offset': 0,
                    } as React.CSSProperties
                  }
                >
                  <button
                    type="button"
                    className="memories-card__hit"
                    onClick={() => {
                      const currentFocus = focusRef.current[index] ?? 0
                      if (currentFocus < FOCUS_OPEN_THRESHOLD) {
                        scrollToIndex(index)
                        return
                      }
                      onOpen(strip)
                    }}
                    aria-label={strip.title}
                  >
                    <span className="memories-card__frame">
                      <img src={strip.image} alt="" draggable={false} />
                    </span>
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </section>
  )
}
