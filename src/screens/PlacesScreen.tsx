import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { PlacesMap } from '../components/PlacesMap'
import { PlaceCoupleRatings } from '../components/PlaceCoupleRatings'
import { PlaceRating } from '../components/PlaceRating'
import { useCouple } from '../context/CoupleContext'
import { placeRatingsForViewer } from '../lib/placeRatings'
import {
  BackIcon,
  BeenToIcon,
  CalendarIcon,
  CameraIcon,
  FilterIcon,
  HomeIcon,
  LocateIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
  WantToGoIcon,
} from '../components/Icons'
import { ScrollRegion } from '../components/ScrollRegion'
import type { PlaceDraft, usePlaces } from '../hooks/usePlaces'
import { isInSingapore, searchPlaces, type GeocodeHit } from '../lib/geocode'
import type { CoupleProfile, FoodPlace, FoodPlaceStatus } from '../types'

type PlacesApi = ReturnType<typeof usePlaces>
type PlacesTab = 'home' | 'map'
type CollectionFilter = 'all' | 'been' | 'want'

const SHEET_COLLAPSED_HEIGHT = 88
const SHEET_EXPANDED_RATIO = 0.46
const SHEET_DRAG_ZONE_HEIGHT = 80

interface PlacesScreenProps extends PlacesApi {
  profile: CoupleProfile
  onBack: () => void
}

const emptyDraft = (status: FoodPlaceStatus): PlaceDraft => ({
  name: '',
  status,
  area: '',
  cuisine: '',
  address: '',
  notes: '',
  myRating: 0,
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

function draftFromPlace(place: FoodPlace, mySlot: 'a' | 'b'): PlaceDraft {
  const ratings = placeRatingsForViewer(place, mySlot)
  return {
    name: place.name,
    status: place.status,
    area: place.area,
    cuisine: place.cuisine,
    address: place.address,
    notes: place.notes,
    myRating: ratings.you,
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
  profile,
  onOpen,
  showCuisine = true,
}: {
  place: FoodPlace
  profile: CoupleProfile
  onOpen: (place: FoodPlace) => void
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
          {place.status === 'been' ? (
            <PlaceCoupleRatings profile={profile} place={place} layout="inline" />
          ) : null}
        </span>
      </button>
    </li>
  )
}

export function PlacesScreen({
  profile,
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
  const { slot } = useCouple()
  const mySlot = slot ?? 'a'
  const [tab, setTab] = useState<PlacesTab>('home')
  const [collection, setCollection] = useState<CollectionFilter | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [editor, setEditor] = useState<FoodPlace | null | 'new'>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [mapStatus, setMapStatus] = useState<CollectionFilter>('all')
  const [mapQuery, setMapQuery] = useState('')
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; token?: number } | null>(null)
  const [sheetHeight, setSheetHeight] = useState<number | null>(null)
  const [sheetDragging, setSheetDragging] = useState(false)
  const mapScreenRef = useRef<HTMLDivElement>(null)
  const sheetDragRef = useRef({ startY: 0, startHeight: 0 })
  const [draft, setDraft] = useState<PlaceDraft>(emptyDraft('been'))
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<GeocodeHit[]>([])
  const [searchBias, setSearchBias] = useState({ lat: 1.3521, lng: 103.8198 })
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
  const showMainTabs = !editing && !detailId && !photoOpen && !collection

  const handleMapSelect = useCallback(
    (id: string) => {
      const place = places.find((item) => item.id === id)
      if (place) {
        setDetailId(place.id)
        setPhotoOpen(false)
        setMenuId(null)
      }
    },
    [places],
  )

  const getSheetExpandedHeight = useCallback(() => {
    const screen = mapScreenRef.current
    const measured = screen?.clientHeight ?? 0
    const height = measured > 0 ? measured : window.innerHeight
    return Math.round(height * SHEET_EXPANDED_RATIO)
  }, [])

  useEffect(() => {
    if (tab !== 'map') return

    const syncSheetHeight = () => {
      setSheetHeight(getSheetExpandedHeight())
    }

    syncSheetHeight()
    const frame = requestAnimationFrame(syncSheetHeight)
    const timer = window.setTimeout(syncSheetHeight, 150)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [tab, getSheetExpandedHeight])

  const resolvedSheetHeight = sheetHeight ?? getSheetExpandedHeight()
  const sheetCollapsed = resolvedSheetHeight <= SHEET_COLLAPSED_HEIGHT + 24

  const handleSheetDragStart = (event: PointerEvent<HTMLElement>) => {
    const sheet = event.currentTarget
    const fromTop = event.clientY - sheet.getBoundingClientRect().top
    if (fromTop > SHEET_DRAG_ZONE_HEIGHT) return

    event.currentTarget.setPointerCapture(event.pointerId)
    sheetDragRef.current = {
      startY: event.clientY,
      startHeight: sheetHeight ?? getSheetExpandedHeight(),
    }
    setSheetDragging(true)
  }

  const handleSheetDragMove = (event: PointerEvent<HTMLElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const delta = sheetDragRef.current.startY - event.clientY
    const expanded = getSheetExpandedHeight()
    const next = Math.min(
      expanded,
      Math.max(SHEET_COLLAPSED_HEIGHT, sheetDragRef.current.startHeight + delta),
    )
    setSheetHeight(next)
  }

  const handleSheetDragEnd = (event: PointerEvent<HTMLElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    setSheetDragging(false)
    const expanded = getSheetExpandedHeight()
    const current = sheetHeight ?? expanded
    const midpoint = (SHEET_COLLAPSED_HEIGHT + expanded) / 2
    setSheetHeight(current < midpoint ? SHEET_COLLAPSED_HEIGHT : expanded)
  }

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
    if (!editor) return
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        if (isInSingapore(latitude, longitude)) {
          setSearchBias({ lat: latitude, lng: longitude })
        }
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600_000 },
    )
  }, [editor])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setHits([])
      return
    }
    const timer = window.setTimeout(() => {
      setSearching(true)
      void searchPlaces(term, searchBias)
        .then(setHits)
        .catch(() => setHits([]))
        .finally(() => setSearching(false))
    }, 320)
    return () => window.clearTimeout(timer)
  }, [query, searchBias])

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
    setDraft(draftFromPlace(place, mySlot))
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
      cuisine: current.cuisine || hit.category || '',
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

  async function handleMyRatingChange(place: FoodPlace, myRating: number) {
    await savePlace({ ...draftFromPlace(place, mySlot), myRating }, place)
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
        setFlyTo({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          token: Date.now(),
        })
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120_000 },
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

            <div className="places-editor__body">
              <section className="places-editor__card">
                <div className="places-editor__photo-row">
                  <button
                    type="button"
                    className="places-editor__photo"
                    onClick={() => photoRef.current?.click()}
                    aria-label="Add photo"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="" />
                    ) : (
                      <CameraIcon size={24} />
                    )}
                  </button>
                  <div className="places-editor__photo-copy">
                    <strong>Add a photo</strong>
                  </div>
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

                <div className="places-editor__fields">
                  <label className="places-field">
                    <span>Place name</span>
                    <input
                      value={draft.name}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder="e.g. Pergh! Chicks"
                      maxLength={80}
                    />
                  </label>

                  <div className="places-field places-editor-location">
                    <div className="places-editor-location__head">
                      <span>Location</span>
                      <span className="places-editor-location__region">Singapore</span>
                    </div>
                    <div
                      className={`places-editor-location__box${
                        hits.length > 0 || (query.trim().length >= 2 && !searching) ? ' is-open' : ''
                      }`}
                    >
                      <div className="places-editor-location__input-wrap">
                        <span className="places-editor-location__icon" aria-hidden>
                          <SearchIcon size={18} />
                        </span>
                        <input
                          className="places-editor-location__input"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Search restaurants, cafes, or areas"
                          autoComplete="off"
                          spellCheck={false}
                        />
                        {searching ? (
                          <span className="places-editor-location__spinner" aria-label="Searching" />
                        ) : null}
                      </div>

                      {hits.length > 0 ? (
                        <ul
                          className="places-editor-location__results"
                          role="listbox"
                          aria-label="Search results"
                        >
                          {hits.map((hit) => (
                            <li key={hit.id} role="option">
                              <button
                                type="button"
                                className="places-editor-location__result"
                                onClick={() => applyHit(hit)}
                              >
                                <span className="places-editor-location__result-icon" aria-hidden>
                                  <MapPinIcon size={16} />
                                </span>
                                <span className="places-editor-location__result-copy">
                                  <span className="places-editor-location__result-top">
                                    <strong>{hit.label}</strong>
                                    {hit.category ? (
                                      <span className="places-editor-location__tag">{hit.category}</span>
                                    ) : null}
                                  </span>
                                  <small>{hit.area || hit.address}</small>
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : query.trim().length >= 2 && !searching ? (
                        <p className="places-editor-location__empty">No places found in Singapore</p>
                      ) : null}
                    </div>
                  </div>

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

                  <div className="places-field">
                    <span>Status</span>
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
                          {value === 'been' ? 'Been to' : 'Want to go'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="places-field">
                    <span>Notes</span>
                    <textarea
                      value={draft.notes}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, notes: event.target.value }))
                      }
                      placeholder="Their chicken chop is amazing!"
                      rows={3}
                      maxLength={400}
                    />
                  </label>

                  {draft.status === 'been' ? (
                    <>
                      <label className="places-field">
                        <span>Date visited</span>
                        <input
                          type="date"
                          value={draft.visitedAt}
                          onChange={(event) =>
                            setDraft((current) => ({ ...current, visitedAt: event.target.value }))
                          }
                        />
                      </label>
                      <fieldset className="places-rating-field">
                        <legend>Your rating</legend>
                        <PlaceRating
                          value={draft.myRating}
                          onChange={(myRating) =>
                            setDraft((current) => ({ ...current, myRating }))
                          }
                          size="lg"
                        />
                      </fieldset>
                    </>
                  ) : null}
                </div>
              </section>
            </div>
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
              <PlaceCoupleRatings profile={profile} place={selected} layout="stack" />
              {selected.notes ? <p className="places-photo__notes">{selected.notes}</p> : null}
            </section>
          </div>
        ) : selected ? (
          <div className={`places-detail${selected.status === 'been' ? ' places-detail--ratings' : ''}`}>
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
            <ScrollRegion
              className={
                selected.status === 'been' ? 'places-detail__content' : 'places-detail__sheet'
              }
            >
              <article className="places-detail-card">
                <h2>{selected.name}</h2>
                <p className="places-detail-card__location">
                  <MapPinIcon size={16} />
                  {locationLine(selected)}
                </p>
                <p className="places-detail-card__status">
                  {[selected.cuisine || 'Place', selected.status === 'been' ? 'Been here' : 'Want to go'].join(
                    ' • ',
                  )}
                </p>
              </article>

              {selected.status === 'been' ? (
                <PlaceCoupleRatings
                  profile={profile}
                  place={selected}
                  onYouChange={(myRating) => void handleMyRatingChange(selected, myRating)}
                />
              ) : null}

              {selected.status !== 'been' ? (
                <>
                  {selected.notes ? <p className="places-detail__blurb">{selected.notes}</p> : null}
                  <div className="places-detail__meta">
                    {selected.visitedAt ? (
                      <span>
                        <CalendarIcon size={16} />
                        Been Here {formatVisit(selected.visitedAt)}
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
                </>
              ) : selected.notes ? (
                <section className="places-detail-notes-card">
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
                  <PlaceRow key={place.id} profile={profile} place={place} onOpen={openDetail} />
                ))}
              </ul>
            )}
          </ScrollRegion>
        ) : showMainTabs ? (
          <div className="places-main-tabs">
            <div
              ref={mapScreenRef}
              className={`places-map-screen${tab === 'map' ? ' is-active' : ''}${
                sheetCollapsed ? ' is-sheet-collapsed' : ''
              }`}
              style={{ '--sheet-height': `${resolvedSheetHeight}px` } as CSSProperties}
              aria-hidden={tab !== 'map'}
            >
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
                  onSelect={handleMapSelect}
                  interactive
                  active={tab === 'map'}
                  autoFitKey={mapStatus}
                  flyTo={flyTo}
                />
                <button type="button" className="places-map-locate" onClick={locate} aria-label="My location">
                  <LocateIcon size={18} />
                </button>
              </div>
              <section
                className={`places-sheet${sheetCollapsed ? ' is-collapsed' : ' is-expanded'}${
                  sheetDragging ? ' is-dragging' : ''
                }`}
                style={{ height: resolvedSheetHeight }}
                onPointerDown={handleSheetDragStart}
                onPointerMove={handleSheetDragMove}
                onPointerUp={handleSheetDragEnd}
                onPointerCancel={handleSheetDragEnd}
              >
                <div className="places-sheet__drag">
                  <span className="places-sheet__handle" aria-hidden />
                  <div className="places-sheet__head">
                    <div className="places-sheet__title">
                      <h2>All Places</h2>
                      <span className="places-sheet__count">{mapPlaces.length}</span>
                    </div>
                  </div>
                </div>
                <div className="places-sheet__body">
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
                        <PlaceRow
                          key={place.id}
                          profile={profile}
                          place={place}
                          onOpen={openDetail}
                        />
                        ))}
                      </ul>
                    )}
                  </ScrollRegion>
                </div>
              </section>
            </div>

            <ScrollRegion className={`places-home${tab === 'home' ? ' is-active' : ''}`} aria-hidden={tab !== 'home'}>
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
                      profile={profile}
                      place={place}
                      onOpen={openDetail}
                      showCuisine={false}
                    />
                  ))}
                </ul>
              )}
            </section>
          </ScrollRegion>
          </div>
        ) : null}
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
