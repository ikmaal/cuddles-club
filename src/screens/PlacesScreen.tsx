import { useEffect, useMemo, useRef, useState } from 'react'
import { PlacesMap } from '../components/PlacesMap'
import {
  BackIcon,
  BeenToIcon,
  BookmarkIcon,
  CalendarIcon,
  CameraIcon,
  FilterIcon,
  HeartIcon,
  HomeIcon,
  LocateIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
  WantToGoIcon,
} from '../components/Icons'
import { ScrollRegion } from '../components/ScrollRegion'
import type { PlaceDraft, usePlaces } from '../hooks/usePlaces'
import { searchPlaces, type GeocodeHit } from '../lib/geocode'
import type { FoodPlace, FoodPlaceStatus } from '../types'

type PlacesApi = ReturnType<typeof usePlaces>
type PlacesTab = 'home' | 'map'
type CollectionFilter = 'all' | 'been' | 'want'

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

function formatVisit(visitedAt: string) {
  if (!visitedAt) return ''
  const date = new Date(`${visitedAt}T12:00:00`)
  if (Number.isNaN(date.getTime())) return visitedAt
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function locationLine(place: FoodPlace) {
  return place.area || place.address || 'Singapore'
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

function PlaceThumb({ place, className }: { place?: FoodPlace; className?: string }) {
  if (place?.photoUrl) {
    return <img src={place.photoUrl} alt="" className={className} />
  }
  return (
    <span className={`${className ?? ''} is-mono`} aria-hidden>
      {(place?.name[0] ?? '?').toUpperCase()}
    </span>
  )
}

function PlaceRow({
  place,
  onOpen,
  mark,
  showCuisine = true,
}: {
  place: FoodPlace
  onOpen: (place: FoodPlace) => void
  mark?: 'heart' | 'bookmark'
  showCuisine?: boolean
}) {
  return (
    <li>
      <button type="button" className="places-row" onClick={() => onOpen(place)}>
        <PlaceThumb place={place} className="places-row__photo" />
        <span className="places-row__copy">
          <strong>{place.name}</strong>
          <small>{locationLine(place)}</small>
          {showCuisine && place.cuisine ? <em>{place.cuisine}</em> : null}
        </span>
        <span
          className={`places-row__mark${
            (mark === 'heart' && place.status === 'been') ||
            (mark === 'bookmark' && place.status === 'want')
              ? ' is-on'
              : ''
          }`}
          aria-hidden
        >
          {mark === 'bookmark' ? <BookmarkIcon size={18} /> : <HeartIcon size={18} />}
        </span>
      </button>
    </li>
  )
}

function StarValue({ rating }: { rating: number }) {
  if (!rating) return null
  return (
    <span className="places-stars">
      {[1, 2, 3, 4, 5].map((value) => (
        <span key={value} className={value <= Math.round(rating) ? 'is-on' : ''}>
          ★
        </span>
      ))}
      <b>{rating.toFixed(1)}</b>
    </span>
  )
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
  const [tab, setTab] = useState<PlacesTab>('home')
  const [collection, setCollection] = useState<CollectionFilter | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [editor, setEditor] = useState<FoodPlace | null | 'new'>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [mapStatus, setMapStatus] = useState<CollectionFilter>('all')
  const [mapQuery, setMapQuery] = useState('')
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null)
  const [draft, setDraft] = useState<PlaceDraft>(emptyDraft('been'))
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<GeocodeHit[]>([])
  const [searching, setSearching] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)
  const photoPreviewRef = useRef('')

  const been = useMemo(() => places.filter((place) => place.status === 'been'), [places])
  const want = useMemo(() => places.filter((place) => place.status === 'want'), [places])
  const recent = useMemo(() => places.slice(0, 6), [places])

  const mapPlaces = useMemo(() => {
    const source =
      mapStatus === 'been' ? been : mapStatus === 'want' ? want : places
    const term = mapQuery.trim().toLowerCase()
    if (!term) return source
    return source.filter((place) =>
      [place.name, place.area, place.cuisine, place.address].join(' ').toLowerCase().includes(term),
    )
  }, [been, mapQuery, mapStatus, places, want])

  const collectionPlaces =
    collection === 'been' ? been : collection === 'want' ? want : collection === 'all' ? places : []
  const collectionTitle =
    collection === 'been' ? 'Been To' : collection === 'want' ? 'Want To Go' : 'All Places'

  const selected = places.find((place) => place.id === detailId) ?? null
  const menuPlace = places.find((place) => place.id === menuId) ?? null
  const editing = Boolean(editor)
  const hideTabs = editing || Boolean(detailId) || photoOpen

  const photoPreview = useMemo(() => {
    if (draft.photoFile) return URL.createObjectURL(draft.photoFile)
    if (editor && editor !== 'new') return editor.photoUrl
    return ''
  }, [draft.photoFile, editor])

  useEffect(() => {
    if (photoPreviewRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreviewRef.current)
    }
    photoPreviewRef.current = photoPreview
    return () => {
      if (photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

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
    setDraft(emptyDraft(collection === 'want' ? 'want' : 'been'))
    setQuery('')
    setHits([])
    setEditor('new')
    setPhotoOpen(false)
  }

  function openEdit(place: FoodPlace) {
    setError('')
    setDraft(draftFromPlace(place))
    setQuery(place.address || [place.name, place.area].filter(Boolean).join(', '))
    setHits([])
    setEditor(place)
    setMenuId(null)
    setPhotoOpen(false)
  }

  function openDetail(place: FoodPlace) {
    setDetailId(place.id)
    setPhotoOpen(false)
    setMenuId(null)
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
    const location = query.trim()
    const saved = await savePlace(
      {
        ...draft,
        address: draft.address.trim() || location,
        area: draft.area.trim() || location,
      },
      editor === 'new' || !editor ? null : editor,
    )
    if (saved) {
      setEditor(null)
      setDetailId(saved.id)
    }
  }

  async function handleDelete(place: FoodPlace) {
    if (!window.confirm(`Remove ${place.name}?`)) return
    const ok = await removePlace(place.id)
    if (!ok) return
    setMenuId(null)
    if (detailId === place.id) {
      setDetailId(null)
      setPhotoOpen(false)
    }
    if (editor !== 'new' && editor?.id === place.id) setEditor(null)
  }

  function goBack() {
    if (photoOpen) {
      setPhotoOpen(false)
      return
    }
    if (editor) {
      setEditor(null)
      return
    }
    if (menuId) {
      setMenuId(null)
      return
    }
    if (detailId) {
      setDetailId(null)
      return
    }
    if (collection) {
      setCollection(null)
      return
    }
    onBack()
  }

  function locate() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFlyTo({ lat: position.coords.latitude, lng: position.coords.longitude })
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return (
    <div className="screen screen--places">
      {!editing && !detailId && !photoOpen && collection ? (
        <header className="places-topbar">
          <button type="button" className="places-icon-ghost" onClick={goBack} aria-label="Back">
            <BackIcon size={20} />
          </button>
          <h1>{collectionTitle}</h1>
          <button type="button" className="places-icon-ghost" onClick={openNew} aria-label="Add a place">
            <PlusIcon size={20} />
          </button>
        </header>
      ) : null}

      <div className="places-stage">
        {error ? (
          <p className="places-error" role="alert">
            {error}
          </p>
        ) : null}

        {editing ? (
          <ScrollRegion className="places-editor">
            <header className="places-editor__bar">
              <button type="button" onClick={() => setEditor(null)}>
                Cancel
              </button>
              <h1>{editor === 'new' ? 'Add a Place' : 'Edit Place'}</h1>
              <button
                type="button"
                className="is-save"
                onClick={() => void submit()}
                disabled={busy || !draft.name.trim()}
              >
                {busy ? 'Saving' : 'Save'}
              </button>
            </header>

            <div className="places-editor__media">
              <button
                type="button"
                className="places-editor__camera"
                onClick={() => photoRef.current?.click()}
                aria-label="Add photo"
              >
                <CameraIcon size={22} />
              </button>
              {photoPreview ? <img src={photoPreview} alt="" /> : null}
              <input
                ref={photoRef}
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    photoFile: event.target.files?.[0] ?? null,
                  }))
                }
              />
            </div>

            <label className="places-field">
              <span>Place Name</span>
              <input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Pergh! Chicks"
                maxLength={80}
              />
            </label>

            <label className="places-field">
              <span>Location</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a street or neighbourhood"
              />
            </label>
            {searching ? <p className="places-hint">Searching…</p> : null}
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

            <label className="places-field">
              <span>Category</span>
              <input
                value={draft.cuisine}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, cuisine: event.target.value }))
                }
                placeholder="Cafe, Western, Zi char…"
                maxLength={40}
              />
            </label>

            <div className="places-segment" role="tablist" aria-label="Status">
              {(['been', 'want'] as FoodPlaceStatus[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={draft.status === value}
                  className={draft.status === value ? 'is-active' : ''}
                  onClick={() => setDraft((current) => ({ ...current, status: value }))}
                >
                  {value === 'been' ? 'Been To' : 'Want To Go'}
                </button>
              ))}
            </div>

            {draft.status === 'been' ? (
              <>
                <label className="places-field">
                  <span>Date Visited</span>
                  <span className="places-field__date">
                    <input
                      type="date"
                      value={draft.visitedAt}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, visitedAt: event.target.value }))
                      }
                    />
                    <CalendarIcon size={18} />
                  </span>
                </label>
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
                    {draft.rating ? <b>{draft.rating.toFixed(1)}</b> : null}
                  </div>
                </fieldset>
              </>
            ) : null}

            <label className="places-field">
              <span>Notes (Optional)</span>
              <textarea
                value={draft.notes}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="Their chicken chop is amazing!"
                rows={4}
                maxLength={400}
              />
            </label>
          </ScrollRegion>
        ) : photoOpen && selected?.photoUrl ? (
          <div className="places-photo">
            <header className="places-photo__bar">
              <button type="button" onClick={() => setPhotoOpen(false)} aria-label="Back">
                <BackIcon size={20} />
              </button>
              <span>1 of 1</span>
              <button type="button" onClick={() => setMenuId(selected.id)} aria-label="More">
                ···
              </button>
            </header>
            <img src={selected.photoUrl} alt={selected.name} />
            <section className="places-photo__card">
              <h2>{selected.name}</h2>
              <p>{locationLine(selected)}</p>
              {selected.visitedAt ? <p>{formatVisit(selected.visitedAt)}</p> : null}
              <StarValue rating={selected.rating} />
              {selected.notes ? <p className="places-photo__notes">{selected.notes}</p> : null}
            </section>
          </div>
        ) : selected ? (
          <div className="places-detail">
            <div className="places-detail__hero">
              {selected.photoUrl ? (
                <img src={selected.photoUrl} alt="" />
              ) : (
                <div className="places-detail__fallback">{selected.name[0]}</div>
              )}
              <button type="button" className="places-detail__round" onClick={goBack} aria-label="Back">
                <BackIcon size={20} />
              </button>
              <button
                type="button"
                className="places-detail__round is-right"
                onClick={() => setMenuId(selected.id)}
                aria-label="More"
              >
                ···
              </button>
            </div>
            <ScrollRegion className="places-detail__sheet">
              <div className="places-detail__title">
                <div>
                  <h2>{selected.name}</h2>
                  <p>{locationLine(selected)}</p>
                  <small>
                    {[selected.cuisine || 'Place', selected.status === 'been' ? 'Been here' : 'Want to go'].join(
                      ' • ',
                    )}
                  </small>
                </div>
                <button
                  type="button"
                  className={`places-heart${selected.status === 'been' ? ' is-on' : ''}`}
                  onClick={() => {
                    if (selected.status === 'want') void markBeen(selected.id)
                  }}
                  aria-label={selected.status === 'been' ? 'Been here' : 'Mark as been'}
                >
                  <HeartIcon size={18} />
                </button>
              </div>
              {selected.notes ? <p className="places-detail__blurb">{selected.notes}</p> : null}
              <div className="places-detail__meta">
                {selected.status === 'been' && selected.visitedAt ? (
                  <span>
                    <CalendarIcon size={16} />
                    Been Here {formatVisit(selected.visitedAt)}
                  </span>
                ) : null}
                {selected.rating ? (
                  <span>
                    ★ Rating {selected.rating.toFixed(1)}
                  </span>
                ) : null}
              </div>
              {selected.photoUrl ? (
                <section className="places-detail__photos">
                  <header>
                    <h3>Photos</h3>
                    <button type="button" onClick={() => setPhotoOpen(true)}>
                      See All
                    </button>
                  </header>
                  <button type="button" className="places-detail__shot" onClick={() => setPhotoOpen(true)}>
                    <img src={selected.photoUrl} alt="" />
                  </button>
                </section>
              ) : null}
              {selected.notes ? (
                <section className="places-detail__notes">
                  <h3>Notes</h3>
                  <p>{selected.notes}</p>
                </section>
              ) : null}
            </ScrollRegion>
          </div>
        ) : collection ? (
          <ScrollRegion className="places-collection">
            <div className="places-collection__banner">
              {collectionPlaces.find((place) => place.photoUrl)?.photoUrl ? (
                <img src={collectionPlaces.find((place) => place.photoUrl)?.photoUrl} alt="" />
              ) : (
                <div className="places-collection__empty-banner" />
              )}
              <strong>
                {collectionPlaces.length} {collectionPlaces.length === 1 ? 'place' : 'places'}
              </strong>
            </div>
            {!ready ? (
              <p className="places-hint">Loading…</p>
            ) : collectionPlaces.length === 0 ? (
              <div className="places-empty-card">
                <h3>Nothing here yet</h3>
                <p>Add a place to this list.</p>
                <button type="button" className="places-solid" onClick={openNew}>
                  Add a place
                </button>
              </div>
            ) : (
              <ul className="places-rows">
                {collectionPlaces.map((place) => (
                  <PlaceRow key={place.id} place={place} onOpen={openDetail} mark="bookmark" />
                ))}
              </ul>
            )}
          </ScrollRegion>
        ) : tab === 'map' ? (
          <div className="places-map-screen">
            <div className="places-search">
              <button type="button" className="places-search__back" onClick={onBack} aria-label="Back">
                <BackIcon size={18} />
              </button>
              <SearchIcon size={18} />
              <input
                value={mapQuery}
                onChange={(event) => setMapQuery(event.target.value)}
                placeholder="Search places, cuisine, or areas"
              />
              <button
                type="button"
                className={`places-search__filter${mapStatus !== 'all' ? ' is-on' : ''}`}
                onClick={() =>
                  setMapStatus((current) =>
                    current === 'all' ? 'been' : current === 'been' ? 'want' : 'all',
                  )
                }
                aria-label="Filter places"
              >
                <FilterIcon size={18} />
              </button>
            </div>
            <div className="places-map-wrap">
              <PlacesMap
                places={mapPlaces}
                selectedId={null}
                onSelect={(id) => {
                  const place = places.find((item) => item.id === id)
                  if (place) openDetail(place)
                }}
                interactive
                flyTo={flyTo}
              />
              <button type="button" className="places-locate" onClick={locate} aria-label="My location">
                <LocateIcon size={18} />
              </button>
            </div>
            <section className="places-sheet">
              <div className="places-sheet__handle" aria-hidden />
              <header className="places-sheet__head">
                <h2>All Places</h2>
              </header>
              <div className="places-chips">
                {([
                  ['all', 'All'],
                  ['been', 'Been To'],
                  ['want', 'Want To Go'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={mapStatus === value ? 'is-active' : ''}
                    onClick={() => setMapStatus(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <ScrollRegion className="places-sheet__list">
                {mapPlaces.length === 0 ? (
                  <p className="places-hint">No places match that search.</p>
                ) : (
                  <ul className="places-rows">
                    {mapPlaces.map((place) => (
                      <PlaceRow key={place.id} place={place} onOpen={openDetail} mark="bookmark" />
                    ))}
                  </ul>
                )}
              </ScrollRegion>
            </section>
          </div>
        ) : (
          <ScrollRegion className="places-home">
            <button type="button" className="places-icon-ghost places-home__back" onClick={onBack} aria-label="Back">
              <BackIcon size={20} />
            </button>
            <section className="places-block">
              <header>
                <h2>Overview</h2>
                <button type="button" onClick={() => setCollection('all')} aria-label="See all places">
                  ›
                </button>
              </header>
              <div className="places-overview">
                <button
                  type="button"
                  className="places-overview__card places-overview__card--been"
                  onClick={() => setCollection('been')}
                >
                  <span className="places-overview__icon" aria-hidden>
                    <BeenToIcon size={22} />
                  </span>
                  <small>Been To</small>
                  <strong>{been.length}</strong>
                  <em>{been.length === 1 ? 'place' : 'places'}</em>
                  {been[0] ? (
                    <PlaceThumb place={been[0]} className="places-overview__photo" />
                  ) : null}
                </button>
                <button
                  type="button"
                  className="places-overview__card places-overview__card--want"
                  onClick={() => setCollection('want')}
                >
                  <span className="places-overview__icon" aria-hidden>
                    <WantToGoIcon size={22} />
                  </span>
                  <small>Want To Go</small>
                  <strong>{want.length}</strong>
                  <em>{want.length === 1 ? 'place' : 'places'}</em>
                  {want[0] ? (
                    <PlaceThumb place={want[0]} className="places-overview__photo" />
                  ) : null}
                </button>
              </div>
            </section>
            <section className="places-block">
              <header>
                <h2>Recently Added</h2>
                <button type="button" onClick={() => setCollection('all')} aria-label="See all places">
                  ›
                </button>
              </header>
              {!ready ? (
                <p className="places-hint">Loading your journal…</p>
              ) : recent.length === 0 ? (
                <div className="places-empty-card">
                  <h3>No places yet</h3>
                  <p>Save somewhere you’ve been, or a date you still want.</p>
                  <button type="button" className="places-solid" onClick={openNew}>
                    Add a place
                  </button>
                </div>
              ) : (
                <ul className="places-rows">
                  {recent.map((place) => (
                    <PlaceRow
                      key={place.id}
                      place={place}
                      onOpen={openDetail}
                      mark="heart"
                      showCuisine={false}
                    />
                  ))}
                </ul>
              )}
            </section>
          </ScrollRegion>
        )}
      </div>

      {hideTabs ? null : (
        <nav className="places-tabbar" aria-label="Noms">
          <button
            type="button"
            className={tab === 'home' ? 'is-active' : ''}
            onClick={() => {
              setCollection(null)
              setTab('home')
            }}
          >
            <HomeIcon size={20} />
            Home
          </button>
          <button type="button" className="places-tabbar__plus" onClick={openNew} aria-label="Add a place">
            <PlusIcon size={22} />
          </button>
          <button
            type="button"
            className={tab === 'map' ? 'is-active' : ''}
            onClick={() => {
              setCollection(null)
              setTab('map')
            }}
          >
            <MapPinIcon size={20} />
            Map
          </button>
        </nav>
      )}

      {menuPlace ? (
        <div className="places-menu" onClick={() => setMenuId(null)}>
          <div className="places-menu__panel" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => openEdit(menuPlace)}>
              Edit
            </button>
            {menuPlace.status === 'want' ? (
              <button
                type="button"
                onClick={() => {
                  void markBeen(menuPlace.id)
                  setMenuId(null)
                }}
              >
                Mark as been
              </button>
            ) : null}
            <button type="button" className="is-danger" onClick={() => void handleDelete(menuPlace)}>
              Delete
            </button>
            <button type="button" onClick={() => setMenuId(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
