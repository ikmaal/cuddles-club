import { useMemo, useState } from 'react'
import { AddPlaceSheet } from './components/AddPlaceSheet'
import { BottomNav } from './components/BottomNav'
import { Logo } from './components/Logo'
import { MapView } from './components/MapView'
import { PlaceDetail } from './components/PlaceDetail'
import { PlaceList } from './components/PlaceList'
import { usePlaces } from './hooks/usePlaces'
import type { Tab } from './types'
import './App.css'

export default function App() {
  const { places, profile, addPlace, deletePlace, updateProfile } = usePlaces()
  const [tab, setTab] = useState<Tab>('map')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')

  const selected = useMemo(
    () => places.find((place) => place.id === selectedId) ?? null,
    [places, selectedId],
  )

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  function handleTabChange(next: Tab) {
    setTab(next)
    if (next !== 'map') setSelectedId(null)
  }

  return (
    <div className="app">
      <div className="app__glow" aria-hidden />

      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden>
            <Logo size={44} />
          </span>
          <div>
            <p className="brand__name">Cuddles Club</p>
            <p className="brand__tag">
              {profile.nameYou} & {profile.namePartner} · {places.length}{' '}
              {places.length === 1 ? 'place' : 'places'}
            </p>
          </div>
        </div>
      </header>

      <main className="app__main">
        {tab === 'map' ? (
          <section className="panel panel--map" aria-label="Map">
            {places.length === 0 ? (
              <div className="map-empty">
                <MapView
                  places={places}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
                <div className="map-empty__card">
                  <h2>No pins yet</h2>
                  <p>Add a place you’ve visited together to start your food map.</p>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setTab('add')}
                  >
                    Add a place
                  </button>
                </div>
              </div>
            ) : (
              <MapView
                places={places}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}
          </section>
        ) : null}

        {tab === 'list' ? (
          <section className="panel panel--list" aria-label="Places">
            <PlaceList
              places={places}
              profile={profile}
              query={query}
              onQueryChange={setQuery}
              onSelect={setSelectedId}
              onAdd={() => setTab('add')}
            />
          </section>
        ) : null}
      </main>

      <BottomNav tab={tab} onChange={handleTabChange} count={places.length} />

      {tab === 'add' ? (
        <AddPlaceSheet
          profile={profile}
          onClose={() => setTab(places.length ? 'map' : 'list')}
          onUpdateProfile={updateProfile}
          onSave={(input) => {
            const place = addPlace(input)
            setSelectedId(place.id)
            setTab('map')
            showToast(`Saved ${place.name}`)
          }}
        />
      ) : null}

      {selected && tab !== 'add' ? (
        <PlaceDetail
          place={selected}
          profile={profile}
          onClose={() => setSelectedId(null)}
          onDelete={(id) => {
            deletePlace(id)
            setSelectedId(null)
            showToast('Place removed')
          }}
          onShowOnMap={(id) => {
            setSelectedId(id)
            setTab('map')
          }}
        />
      ) : null}

      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
