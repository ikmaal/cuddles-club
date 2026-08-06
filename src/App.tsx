import { useCallback, useState } from 'react'
import { HeartIcon, HomeIcon } from './components/Icons'
import { SplashIntro } from './components/SplashIntro'
import { useCouple } from './context/CoupleContext'
import { usePhotostrips } from './hooks/usePhotostrips'
import { useProfile } from './hooks/useProfile'
import { HomeScreen } from './screens/HomeScreen'
import { StripsScreen } from './screens/StripsScreen'
import { UsScreen } from './screens/UsScreen'
import type { Screen } from './types'
import './App.css'

const TABS: { id: Screen; label: string; Icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'us', label: 'Us', Icon: HeartIcon },
]

export default function App() {
  const { ready } = useCouple()
  const { profile, updateProfile } = useProfile()
  const strips = usePhotostrips()

  const [screen, setScreen] = useState<Screen>('home')
  const [showSplash, setShowSplash] = useState(true)

  const finishSplash = useCallback(() => setShowSplash(false), [])

  const goHome = () => setScreen('home')
  const showTabs = !showSplash && (screen === 'home' || screen === 'us')

  if (!ready) {
    return (
      <div className="app app--boot">
        <p className="app__boot">Loading Cuddles Club…</p>
      </div>
    )
  }

  return (
    <div className="app">
      {showSplash ? <SplashIntro onDone={finishSplash} /> : null}

      <main className={`app__main ${showTabs ? 'has-tabs' : ''}`}>
        {screen === 'home' ? (
          <HomeScreen profile={profile} onOpen={setScreen} />
        ) : null}

        {screen === 'strips' ? (
          <StripsScreen
            profile={profile}
            strips={strips.strips}
            ready={strips.ready}
            busy={strips.busy}
            error={strips.error}
            onAdd={strips.addFromFile}
            onAddBooth={strips.addFromDataUrl}
            onRename={strips.rename}
            onRemove={strips.remove}
            onClearError={() => strips.setError()}
            onBack={goHome}
          />
        ) : null}

        {screen === 'us' ? (
          <UsScreen profile={profile} onSave={updateProfile} />
        ) : null}
      </main>

      {showTabs ? (
        <nav className="tabbar" aria-label="Main">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tabbar__item ${screen === tab.id ? 'is-active' : ''}`}
              onClick={() => setScreen(tab.id)}
              aria-current={screen === tab.id ? 'page' : undefined}
            >
              <tab.Icon size={22} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      ) : null}
    </div>
  )
}
