import { useMemo, useState } from 'react'
import { CatHome } from './components/CatHome'
import { Logo } from './components/Logo'
import { PlayGame } from './components/PlayGame'
import { useCat } from './hooks/useCat'
import { useProfile } from './hooks/useProfile'
import './App.css'

export default function App() {
  const { profile, updateProfile } = useProfile()
  const {
    cat,
    mood,
    level,
    feed,
    groom,
    pet,
    toggleSleep,
    finishPlay,
    setCarer,
    rename,
  } = useCat()

  const [toast, setToast] = useState('')
  const [playing, setPlaying] = useState(false)

  const tagline = useMemo(
    () => `${profile.nameYou} & ${profile.namePartner} · ${cat.name} lv ${level}`,
    [profile.nameYou, profile.namePartner, cat.name, level],
  )

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
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
            <p className="brand__tag">{tagline}</p>
          </div>
        </div>
      </header>

      <main className="app__main">
        <section className="panel panel--cat" aria-label="Our cat">
          <CatHome
            cat={cat}
            mood={mood}
            level={level}
            profile={profile}
            onFeed={feed}
            onGroom={groom}
            onPet={pet}
            onToggleSleep={toggleSleep}
            onPlay={() => setPlaying(true)}
            onSetCarer={setCarer}
            onRename={rename}
            onUpdateProfile={updateProfile}
            onNotify={showToast}
          />
        </section>
      </main>

      {playing ? (
        <PlayGame
          catName={cat.name}
          bestScore={cat.bestScore}
          onClose={() => setPlaying(false)}
          onFinish={(score) => {
            const result = finishPlay(score)
            setPlaying(false)
            showToast(
              result.gainedXp > 0
                ? `${result.message} · +${result.gainedXp} XP`
                : result.message,
            )
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
