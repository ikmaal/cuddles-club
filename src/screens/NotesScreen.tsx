import { useState } from 'react'
import { ScreenHeader } from '../components/ScreenHeader'
import { TrashIcon } from '../components/Icons'
import { formatRelative } from '../hooks/useStored'
import type { Carer, CoupleProfile, Note } from '../types'

interface NotesScreenProps {
  notes: Note[]
  profile: CoupleProfile
  author: Carer
  onSetAuthor: (author: Carer) => void
  onAdd: (text: string, author: Carer) => void
  onRemove: (id: string) => void
  onBack: () => void
}

export function NotesScreen({
  notes,
  profile,
  author,
  onSetAuthor,
  onAdd,
  onRemove,
  onBack,
}: NotesScreenProps) {
  const [draft, setDraft] = useState('')

  function submit(event: React.FormEvent) {
    event.preventDefault()
    onAdd(draft, author)
    setDraft('')
  }

  return (
    <div className="screen">
      <ScreenHeader
        title="Love Notes"
        subtitle="Little messages you can read back later"
        onBack={onBack}
      />

      <div className="screen__scroll">
        <form className="surface composer" onSubmit={submit}>
          <div className="composer__who">
            <span>From</span>
            <div className="segmented">
              <button
                type="button"
                className={author === 'you' ? 'is-active' : ''}
                onClick={() => onSetAuthor('you')}
                aria-pressed={author === 'you'}
              >
                {profile.nameYou}
              </button>
              <button
                type="button"
                className={author === 'partner' ? 'is-active' : ''}
                onClick={() => onSetAuthor('partner')}
                aria-pressed={author === 'partner'}
              >
                {profile.namePartner}
              </button>
            </div>
          </div>

          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write something sweet…"
            rows={3}
            maxLength={280}
            aria-label="Your note"
          />

          <div className="composer__foot">
            <span className="composer__count">{draft.length}/280</span>
            <button
              type="submit"
              className="btn btn--primary btn--sm"
              disabled={!draft.trim()}
            >
              Leave note
            </button>
          </div>
        </form>

        {notes.length === 0 ? (
          <div className="empty">
            <p className="empty__title">No notes yet</p>
            <p className="empty__body">
              The first one is always the hardest. Write anything.
            </p>
          </div>
        ) : (
          <ul className="note-list">
            {notes.map((note) => (
              <li key={note.id} className="surface note">
                <div className="note__head">
                  <span className={`pill pill--${note.author}`}>
                    {note.author === 'you' ? profile.nameYou : profile.namePartner}
                  </span>
                  <span className="note__time">{formatRelative(note.createdAt)}</span>
                  <button
                    type="button"
                    className="ghost-icon"
                    onClick={() => onRemove(note.id)}
                    aria-label="Delete note"
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
                <p className="note__text">{note.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
