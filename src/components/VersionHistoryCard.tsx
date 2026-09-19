import { useMemo, useState } from 'react'
import {
  APP_META,
  formatReleaseDate,
  RELEASE_HISTORY,
  type ReleaseNote,
} from '../lib/versionHistory'

const INITIAL_VISIBLE = 3

function ReleaseEntry({ note, isLast }: { note: ReleaseNote; isLast: boolean }) {
  return (
    <li className="version-history__entry">
      <div
        className={`version-history__marker${isLast ? ' version-history__marker--last' : ''}`}
        aria-hidden
      >
        <span className="version-history__dot" />
      </div>
      <div className="version-history__body">
        <div className="version-history__meta">
          <time dateTime={note.date}>{formatReleaseDate(note.date)}</time>
          <span className="version-history__entry-version">v{note.version}</span>
        </div>
        <h3 className="version-history__entry-title">{note.title}</h3>
        <ul className="version-history__highlights">
          {note.highlights.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </li>
  )
}

export function VersionHistoryCard() {
  const [expanded, setExpanded] = useState(false)

  const visibleNotes = useMemo(
    () => (expanded ? RELEASE_HISTORY : RELEASE_HISTORY.slice(0, INITIAL_VISIBLE)),
    [expanded],
  )

  const hasMore = RELEASE_HISTORY.length > INITIAL_VISIBLE

  return (
    <section className="surface version-history-card" aria-label="Version history">
      <div className="version-history__hero">
        <div className="version-history__brand">
          <p className="version-history__app">{APP_META.name}</p>
          <span className="version-history__version-pill">v{APP_META.version}</span>
        </div>
        <p className="version-history__updated">
          Last updated{' '}
          <time dateTime={APP_META.lastUpdated}>{formatReleaseDate(APP_META.lastUpdated)}</time>
        </p>
      </div>

      <div className="version-history__divider" role="presentation" />

      <h2 className="version-history__heading">Version history</h2>

      <ol className="version-history__timeline">
        {visibleNotes.map((note, index) => (
          <ReleaseEntry
            key={`${note.date}-${note.version}`}
            note={note}
            isLast={index === visibleNotes.length - 1}
          />
        ))}
      </ol>

      {hasMore ? (
        <button
          type="button"
          className="version-history__toggle"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
        >
          {expanded ? 'Show fewer updates' : `Show ${RELEASE_HISTORY.length - INITIAL_VISIBLE} earlier updates`}
        </button>
      ) : null}
    </section>
  )
}
