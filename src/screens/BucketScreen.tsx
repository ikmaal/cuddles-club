import { useState } from 'react'
import { PlusIcon, TrashIcon } from '../components/Icons'
import { ScrollRegion } from '../components/ScrollRegion'
import { ScreenHeader } from '../components/ScreenHeader'
import type { BucketItem } from '../types'

interface BucketScreenProps {
  items: BucketItem[]
  onAdd: (text: string) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onBack: () => void
}

export function BucketScreen({
  items,
  onAdd,
  onToggle,
  onRemove,
  onBack,
}: BucketScreenProps) {
  const [draft, setDraft] = useState('')

  const done = items.filter((item) => item.done).length
  const total = items.length
  const progress = total === 0 ? 0 : (done / total) * 100

  const open = items.filter((item) => !item.done)
  const complete = items.filter((item) => item.done)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    onAdd(draft)
    setDraft('')
  }

  return (
    <div className="screen">
      <ScreenHeader
        title="Bucket List"
        subtitle="Everything you want to do together"
        onBack={onBack}
      />

      <ScrollRegion className="screen__scroll">
        <div className="surface progress-card">
          <div className="progress-card__top">
            <span>
              {done} of {total} done
            </span>
            <strong>{Math.round(progress)}%</strong>
          </div>
          <div className="track">
            <div className="track__fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <form className="inline-add" onSubmit={submit}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add something to do together"
            maxLength={90}
            aria-label="New bucket list item"
          />
          <button
            type="submit"
            className="inline-add__btn"
            disabled={!draft.trim()}
            aria-label="Add item"
          >
            <PlusIcon size={20} />
          </button>
        </form>

        {open.length > 0 ? (
          <ul className="check-list">
            {open.map((item) => (
              <li key={item.id} className="surface check">
                <label className="check__main">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => onToggle(item.id)}
                  />
                  <span className="check__box" aria-hidden />
                  <span className="check__text">{item.text}</span>
                </label>
                <button
                  type="button"
                  className="ghost-icon"
                  onClick={() => onRemove(item.id)}
                  aria-label={`Remove ${item.text}`}
                >
                  <TrashIcon size={18} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {complete.length > 0 ? (
          <>
            <div className="section-head section-head--tight">
              <h2>Done together</h2>
            </div>
            <ul className="check-list">
              {complete.map((item) => (
                <li key={item.id} className="surface check is-done">
                  <label className="check__main">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => onToggle(item.id)}
                    />
                    <span className="check__box" aria-hidden />
                    <span className="check__text">{item.text}</span>
                  </label>
                  <button
                    type="button"
                    className="ghost-icon"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Remove ${item.text}`}
                  >
                    <TrashIcon size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {total === 0 ? (
          <div className="empty">
            <p className="empty__title">Nothing on the list</p>
            <p className="empty__body">Add the first thing you want to do together.</p>
          </div>
        ) : null}
      </ScrollRegion>
    </div>
  )
}
