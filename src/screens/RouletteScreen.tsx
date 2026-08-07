import { useEffect, useRef, useState } from 'react'
import { PlusIcon, TrashIcon } from '../components/Icons'
import { ScrollRegion } from '../components/ScrollRegion'
import { ScreenHeader } from '../components/ScreenHeader'
import type { DateIdea } from '../types'

interface RouletteScreenProps {
  ideas: DateIdea[]
  onAdd: (text: string) => void
  onRemove: (id: string) => void
  onBack: () => void
}

export function RouletteScreen({
  ideas,
  onAdd,
  onRemove,
  onBack,
}: RouletteScreenProps) {
  const [draft, setDraft] = useState('')
  const [index, setIndex] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const indexRef = useRef(0)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  function spin() {
    if (spinning || ideas.length === 0) return

    setResult(null)
    setSpinning(true)

    const totalTicks = 16 + Math.floor(Math.random() * 8)
    let tick = 0

    const step = () => {
      indexRef.current = (indexRef.current + 1) % ideas.length
      setIndex(indexRef.current)
      tick += 1

      if (tick >= totalTicks) {
        setSpinning(false)
        setResult(ideas[indexRef.current]?.text ?? null)
        return
      }

      timer.current = window.setTimeout(step, 55 + tick * tick * 0.6)
    }

    step()
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    onAdd(draft)
    setDraft('')
  }

  const current = ideas[index]?.text ?? 'Add an idea to start'

  return (
    <div className="screen">
      <ScreenHeader
        title="Date Spin"
        subtitle="When neither of you can decide"
        onBack={onBack}
      />

      <ScrollRegion className="screen__scroll">
        <div className="surface spinner">
          <p className="spinner__eyebrow">
            {result ? 'Tonight’s plan' : spinning ? 'Spinning…' : 'Ready when you are'}
          </p>
          <p className={`spinner__value ${spinning ? 'is-spinning' : ''}`}>
            {result ?? current}
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={spin}
            disabled={spinning || ideas.length === 0}
          >
            {result ? 'Spin again' : 'Spin the wheel'}
          </button>
        </div>

        <div className="section-block">
          <div className="section-head section-head--tight">
            <h2>The pool</h2>
            <span className="section-head__meta">
              {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}
            </span>
          </div>

          <form className="inline-add" onSubmit={submit}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add your own date idea"
              maxLength={90}
              aria-label="New date idea"
            />
            <button
              type="submit"
              className="inline-add__btn"
              disabled={!draft.trim()}
              aria-label="Add idea"
            >
              <PlusIcon size={20} />
            </button>
          </form>

          <ul className="chip-list">
            {ideas.map((idea) => (
              <li key={idea.id} className="chip">
                <span className="chip__text">{idea.text}</span>
                <button
                  type="button"
                  onClick={() => onRemove(idea.id)}
                  aria-label={`Remove ${idea.text}`}
                >
                  <TrashIcon size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {ideas.length === 0 ? (
          <div className="empty">
            <p className="empty__title">The pool is empty</p>
            <p className="empty__body">Add a few ideas and the wheel will do the rest.</p>
          </div>
        ) : null}
      </ScrollRegion>
    </div>
  )
}
