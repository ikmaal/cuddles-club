import { useEffect, useMemo, useRef, useState } from 'react'
import { PlacesMap } from '../components/PlacesMap'
import { ScreenHeader } from '../components/ScreenHeader'
import { ScrollRegion } from '../components/ScrollRegion'
import type { PlaceDraft, usePlaces } from '../hooks/usePlaces'
import { searchPlaces, type GeocodeHit } from '../lib/geocode'
import type { FoodPlace, FoodPlaceStatus } from '../types'

type PlacesApi = ReturnType<typeof usePlaces>

interface PlacesScreenProps extends PlacesApi {
  onBack: () => void
}

const emptyDraft = (status: FoodPlaceStatus): PlaceDraft => ({
  name: '',
  status,
  area: '',
  cuisine: '',
  address: '',
  notes: '',
  rating: 0,
  lat: null,
  lng: null,
  visitedAt: '',
  photoFile: null,
})

function stars(rating: number) {
  if (!rating) return ''
  return `${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))}`
}

function formatVisit(visitedAt: string) {
  if (!visitedAt) return ''
  const date = new Date(`${visitedAt}T12:00:00`)
  if (Number.isNaN(date.getTime())) return visitedAt
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

function draftFromPlace(place: FoodPlace): PlaceDraft {
  return {
    name: place.name,
    status: place.status,
    area: place.area,
    cuisine: place.cuisine,
    address: place.address,
    notes: place.notes,
    rating: place.rating,
    lat: place.lat,
    lng: place.lng,
    visitedAt: place.visitedAt,
    photoFile: null,
  }
}

export function PlacesScreen({
  places,
  ready,
  busy,
  error,
  onBack,
  setError,
  savePlace,
  markBeen,
  removePlace,
}: PlacesScreenProps) {
  const [status, setStatus] = useState<FoodPlaceStatus>('been')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editor, setEditor] = useState<FoodPlace | null | 'new'>(null)
  const [draft, setDraft] = useState<PlaceDraft>(emptyDraft('been'))
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<GeocodeHit[]>([])
  const [searching, setSearching] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(
    () => places.filter((place) => place.status === status),
    [places, status],
  )

  const selected = filtered.find((place) => place.id === selectedId) ?? filtered[0] ?? null
  const editing = Boolean(editor)
  const preview = useMemo(() => {
    if (!editing || draft.lat == null || draft.lng == null) return null
    return { lat: draft.lat, lng: draft.lng, status: draft.status }
  }, [draft.lat, draft.lng, draft.status, editing])
  const mapPlaces = editing ? [] : filtered
  const mapEmpty = editing
    ? preview == null
    : mapPlaces.every((place) => place.lat == null || place.lng == null)

  useEffect(() => {
    setSelectedId((current) => {
      if (current && filtered.some((place) => place.id === current)) return current
      return filtered[0]?.id ?? null
    })
  }, [filtered])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 3) {
      setHits([])
      return
    }
    const timer = window.setTimeout(() => {
      setSearching(true)
      void searchPlaces(term)
        .then(setHits)
        .catch(() => setHits([]))
        .finally(() => setSearching(false))
    }, 420)
    return () => window.clearTimeout(timer)
  }, [query])

  function openNew() {
    setError('')
    setDraft(emptyDraft(status))
    setQuery('')
    setHits([])
    setEditor('new')
  }

  function openEdit(place: FoodPlace) {
    setError('')
    setDraft(draftFromPlace(place))
    setQuery(place.address || [place.name, place.area].filter(Boolean).join(', '))
    setHits([])
    setEditor(place)
  }

  function applyHit(hit: GeocodeHit) {
    setDraft((current) => ({
      ...current,
      name: current.name || hit.label,
      area: current.area || hit.area,
      address: hit.address,
      lat: hit.lat,
      lng: hit.lng,
    }))
    setQuery(hit.label)
    setHits([])
  }

  async function submit() {
    const saved = await savePlace(draft, editor === 'new' || !editor ? null : editor)
    if (saved) {
      setEditor(null)
      setStatus(saved.status)
      setSelectedId(saved.id)
    }
  }

  async function handleDelete(place: FoodPlace) {
    if (!window.confirm(`Remove ${place.name}?`)) return
    const ok = await removePlace(place.id)
    if (ok && editor !== 'new' && editor?.id === place.id) setEditor(null)
  }

  const beenCount = places.filter((place) => place.status === 'been').length
  const wantCount = places.filter((place) => place.status === 'want').length

  return (
    <div className="screen screen--places">
      <ScreenHeader
        title={editing ? (editor === 'new' ? 'New place' : 'Edit place') : 'Places'}
        subtitle={
          editing ? 'Search to drop a pin, then fill in the rest' : 'Where you’ve been, and where to go'
        }
        onBack={editing ? () => setEditor(null) : onBack}
        action={
          editing ? undefined : (
            <button type="button" className="places-icon-btn" onClick={openNew} aria-label="Add place">
              +
            </button>
          )
        }
      />

      <div className="places-toolbar">
        <div className="places-tabs" role="tablist" aria-label={editing ? 'Status' : 'Place lists'}>
          {(['been', 'want'] as FoodPlaceStatus[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={(editing ? draft.status : status) === tab}
              className={`places-tabs__tab${(editing ? draft.status : status) === tab ? ' is-active' : ''}`}
              onClick={() => {
                if (editing) setDraft((current) => ({ ...current, status: tab }))
                else setStatus(tab)
              }}
            >
              {editing
                ? tab === 'been'
                  ? 'Been'
                  : 'Want'
                : tab === 'been'
                  ? `Been · ${beenCount}`
                  : `Want · ${wantCount}`}
            </button>
          ))}
        </div>
      </div>

      <ScrollRegion className="screen__scroll places-scroll">
        <div className="places-map-wrap">
          <PlacesMap
            places={mapPlaces}
            selectedId={editing ? null : (selected?.id ?? null)}
            onSelect={setSelectedId}
            preview={preview}
          />
          {mapEmpty ? (
            <p className="places-map__empty">
              {editing
                ? 'Search a restaurant below to drop a pin.'
                : 'Search a restaurant when you add it to drop a pin.'}
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="places-error" role="alert">
            {error}
          </p>
        ) : null}

        {editing ? (
          <div className="places-form">
            <label className="field">
              <span>Name</span>
              <input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Restaurant or stall"
                maxLength={80}
              />
            </label>

            <label className="field">
              <span>Find on map</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name + neighbourhood"
              />
            </label>
            {searching ? <p className="places-hint">Searching…</p> : null}
            {preview ? <p className="places-hint">Pinned on the map</p> : null}
            {hits.length > 0 ? (
              <ul className="places-hits">
                {hits.map((hit) => (
                  <li key={`${hit.lat},${hit.lng}`}>
                    <button type="button" onClick={() => applyHit(hit)}>
                      <strong>{hit.label}</strong>
                      <small>{hit.address}</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <label className="field">
              <span>Area</span>
              <input
                value={draft.area}
                onChange={(event) => setDraft((current) => ({ ...current, area: event.target.value }))}
                placeholder="Tiong Bahru, JB…"
                maxLength={40}
              />
            </label>

            <label className="field">
              <span>Cuisine</span>
              <input
                value={draft.cuisine}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, cuisine: event.target.value }))
                }
                placeholder="Zi char, pasta, kopi…"
                maxLength={40}
              />
            </label>

            {draft.status === 'been' ? (
              <>
                <fieldset className="places-rating">
                  <legend>Rating</legend>
                  <div>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={draft.rating >= value ? 'is-on' : ''}
                        onClick={() => setDraft((current) => ({ ...current, rating: value }))}
                        aria-label={`${value} stars`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="field field--date">
                  <span>Visited (optional)</span>
                  <input
                    type="date"
                    value={draft.visitedAt}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, visitedAt: event.target.value }))
                    }
                  />
                </label>
              </>
            ) : null}

            <label className="field">
              <span>Notes</span>
              <textarea
                value={draft.notes}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="What to order, vibe, parking…"
                rows={3}
                maxLength={400}
              />
            </label>

            <label className="field">
              <span>Photo (optional)</span>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    photoFile: event.target.files?.[0] ?? null,
                  }))
                }
              />
            </label>

            <button
              type="button"
              className="btn btn--primary places-btn"
              onClick={() => void submit()}
              disabled={busy || !draft.name.trim()}
            >
              {busy ? 'Saving…' : 'Save place'}
            </button>
          </div>
        ) : !ready ? (
          <p className="places-empty">Loading your journal…</p>
        ) : filtered.length === 0 ? (
          <div className="places-empty-card">
            <h3>{status === 'been' ? 'No visits yet' : 'Nothing on the list'}</h3>
            <p>
              {status === 'been'
                ? 'Log a restaurant you’ve already tried together.'
                : 'Save a place you want to try on a date night.'}
            </p>
            <button type="button" className="btn btn--primary places-btn" onClick={openNew}>
              Add a place
            </button>
          </div>
        ) : (
          <>
            <ul className="places-list">
              {filtered.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    className={`places-card${selected?.id === place.id ? ' is-selected' : ''}`}
                    onClick={() => setSelectedId(place.id)}
                  >
                    {place.photoUrl ? (
                      <img src={place.photoUrl} alt="" className="places-card__photo" />
                    ) : (
                      <span className="places-card__mono" aria-hidden>
                        {(place.name[0] ?? '?').toUpperCase()}
                      </span>
                    )}
                    <span className="places-card__copy">
                      <strong>{place.name}</strong>
                      <small>
                        {[place.area, place.cuisine].filter(Boolean).join(' · ') || 'No area yet'}
                      </small>
                      <small className="places-card__meta">
                        {place.status === 'been'
                          ? [stars(place.rating), formatVisit(place.visitedAt) || 'Visited']
                              .filter(Boolean)
                              .join(' · ')
                          : 'Want to go'}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {selected ? (
              <section className="places-detail" aria-label={selected.name}>
                <header className="places-detail__head">
                  {selected.photoUrl ? (
                    <img src={selected.photoUrl} alt="" className="places-detail__photo" />
                  ) : null}
                  <div>
                    <p className="places-detail__eyebrow">
                      {selected.status === 'been' ? 'Been' : 'Want'}
                    </p>
                    <h2>{selected.name}</h2>
                    <p>{[selected.area, selected.cuisine].filter(Boolean).join(' · ')}</p>
                  </div>
                </header>
                {selected.address ? (
                  <p className="places-detail__address">{selected.address}</p>
                ) : null}
                {selected.notes ? <p className="places-detail__notes">{selected.notes}</p> : null}
                <div className="places-detail__actions">
                  {selected.status === 'want' ? (
                    <button
                      type="button"
                      className="btn btn--primary places-btn"
                      onClick={() => void markBeen(selected.id)}
                      disabled={busy}
                    >
                      Mark as been
                    </button>
                  ) : null}
                  <button type="button" className="places-text-btn" onClick={() => openEdit(selected)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="places-text-btn is-danger"
                    onClick={() => void handleDelete(selected)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </div>
              </section>
            ) : null}
          </>
        )}
      </ScrollRegion>
    </div>
  )
}
