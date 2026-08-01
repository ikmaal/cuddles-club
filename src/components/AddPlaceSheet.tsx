import { useEffect, useState } from 'react'
import { reverseGeocode, searchPlaces } from '../lib/geo'
import type { CoupleProfile, Cuisine, Place } from '../types'
import { CUISINES } from '../types'
import { MapView } from './MapView'
import { StarRating } from './StarRating'

interface AddPlaceSheetProps {
  profile: CoupleProfile
  onClose: () => void
  onSave: (place: Omit<Place, 'id' | 'createdAt'>) => void
  onUpdateProfile: (profile: CoupleProfile) => void
}

type Step = 'details' | 'pin'

interface SearchHit {
  name: string
  lat: number
  lng: number
  address: string
}

export function AddPlaceSheet({
  profile,
  onClose,
  onSave,
  onUpdateProfile,
}: AddPlaceSheetProps) {
  const [step, setStep] = useState<Step>('details')
  const [name, setName] = useState('')
  const [cuisine, setCuisine] = useState<Cuisine>('Cafe')
  const [visitedAt, setVisitedAt] = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [ratingYou, setRatingYou] = useState(4)
  const [ratingPartner, setRatingPartner] = useState(4)
  const [note, setNote] = useState('')
  const [wouldReturn, setWouldReturn] =
    useState<Place['wouldReturn']>('yes')
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(
    null,
  )
  const [address, setAddress] = useState('')
  const [search, setSearch] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const [nameYou, setNameYou] = useState(profile.nameYou)
  const [namePartner, setNamePartner] = useState(profile.namePartner)

  useEffect(() => {
    const q = search.trim()
    if (q.length < 3) {
      setHits([])
      return
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setSearching(true)
      const results = await searchPlaces(q)
      if (!cancelled) {
        setHits(results)
        setSearching(false)
      }
    }, 400)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [search])

  async function handlePick(lat: number, lng: number) {
    setLatLng({ lat, lng })
    setError('')
    const label = await reverseGeocode(lat, lng)
    if (label) setAddress(label)
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError('Location isn’t available on this device.')
      return
    }
    setLocating(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await handlePick(pos.coords.latitude, pos.coords.longitude)
        setLocating(false)
      },
      () => {
        setLocating(false)
        setError('Couldn’t get your location. Tap the map instead.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  function chooseHit(hit: SearchHit) {
    setName((prev) => prev || hit.name)
    setAddress(hit.address)
    setLatLng({ lat: hit.lat, lng: hit.lng })
    setSearch('')
    setHits([])
    setError('')
  }

  function validateDetails(): boolean {
    if (!name.trim()) {
      setError('Add a place name.')
      return false
    }
    if (ratingYou < 1 || ratingPartner < 1) {
      setError('Both of you need a rating.')
      return false
    }
    setError('')
    return true
  }

  function goToPin() {
    if (!validateDetails()) return
    onUpdateProfile({
      nameYou: nameYou.trim() || 'You',
      namePartner: namePartner.trim() || 'Partner',
    })
    setStep('pin')
  }

  function handleSave() {
    if (!validateDetails()) return
    if (!latLng) {
      setError('Drop a pin on the map so we know where this place is.')
      setStep('pin')
      return
    }

    onSave({
      name: name.trim(),
      cuisine,
      lat: latLng.lat,
      lng: latLng.lng,
      address: address.trim() || undefined,
      // Noon local avoids UTC date-shift from date-only strings
      visitedAt: new Date(`${visitedAt}T12:00:00`).toISOString(),
      ratingYou,
      ratingPartner,
      note: note.trim(),
      wouldReturn,
    })
  }

  return (
    <div className="sheet-backdrop sheet-backdrop--full" role="presentation">
      <div
        className="sheet sheet--full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-place-title"
      >
        <header className="sheet__header">
          <div>
            <p className="eyebrow">
              {step === 'details' ? 'Step 1 of 2' : 'Step 2 of 2'}
            </p>
            <h2 id="add-place-title">
              {step === 'details' ? 'Add a place' : 'Pin it on the map'}
            </h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        {step === 'details' ? (
          <form
            className="add-form"
            onSubmit={(e) => {
              e.preventDefault()
              goToPin()
            }}
          >
            <div className="field-row">
              <label className="field">
                <span>Your name</span>
                <input
                  value={nameYou}
                  onChange={(e) => setNameYou(e.target.value)}
                  placeholder="Ikmal"
                  maxLength={24}
                />
              </label>
              <label className="field">
                <span>Partner’s name</span>
                <input
                  value={namePartner}
                  onChange={(e) => setNamePartner(e.target.value)}
                  placeholder="Love"
                  maxLength={24}
                />
              </label>
            </div>

            <label className="field">
              <span>Place name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nasi Lemak Tanglin"
                autoFocus
                required
              />
            </label>

            <label className="field">
              <span>Cuisine</span>
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value as Cuisine)}
              >
                {CUISINES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Date visited</span>
              <input
                type="date"
                value={visitedAt}
                onChange={(e) => setVisitedAt(e.target.value)}
                required
              />
            </label>

            <div className="rating-block">
              <StarRating
                label={nameYou.trim() || 'You'}
                value={ratingYou}
                onChange={setRatingYou}
              />
              <StarRating
                label={namePartner.trim() || 'Partner'}
                value={ratingPartner}
                onChange={setRatingPartner}
              />
            </div>

            <fieldset className="return-field">
              <legend>Would you return?</legend>
              <div className="return-options">
                {(
                  [
                    ['yes', 'Yes'],
                    ['maybe', 'Maybe'],
                    ['no', 'No'],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="return-option">
                    <input
                      type="radio"
                      name="wouldReturn"
                      value={value}
                      checked={wouldReturn === value}
                      onChange={() => setWouldReturn(value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="field">
              <span>Memory note</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What made this meal special?"
                rows={3}
                maxLength={280}
              />
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="sheet__actions">
              <button type="button" className="btn btn--ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary">
                Next: pin location
              </button>
            </div>
          </form>
        ) : (
          <div className="pin-step">
            <label className="field">
              <span>Search a place</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search OpenStreetMap…"
                autoComplete="off"
              />
            </label>

            {searching ? <p className="muted">Searching…</p> : null}
            {hits.length > 0 ? (
              <ul className="search-hits">
                {hits.map((hit) => (
                  <li key={`${hit.lat}-${hit.lng}-${hit.address}`}>
                    <button type="button" onClick={() => chooseHit(hit)}>
                      <strong>{hit.name}</strong>
                      <span>{hit.address}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="pin-map">
              <MapView
                places={[]}
                selectedId={null}
                onSelect={() => undefined}
                pickMode
                pickLatLng={latLng}
                onPick={handlePick}
              />
            </div>

            <div className="pin-actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={useCurrentLocation}
                disabled={locating}
              >
                {locating ? 'Finding you…' : 'Use my location'}
              </button>
              {latLng ? (
                <p className="muted pin-coords">
                  Pin set · {latLng.lat.toFixed(5)}, {latLng.lng.toFixed(5)}
                </p>
              ) : null}
            </div>

            <label className="field">
              <span>Address (optional)</span>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Filled automatically when you drop a pin"
              />
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="sheet__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setStep('details')}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSave}
                disabled={!latLng}
              >
                Save place
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
