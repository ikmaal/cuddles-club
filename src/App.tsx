import { useCallback, useEffect, useState } from 'react'
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

const HOME_BG_URL = `${import.meta.env.BASE_URL}background.png`

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

  useEffect(() => {
    const img = new Image()
    img.src = HOME_BG_URL
  }, [])

  useEffect(() => {
    const active = screen === 'home' && ready && !showSplash
    const root = document.documentElement
    root.classList.toggle('home-bg', active)
    if (active) {
      root.style.setProperty('--home-bg', `url(${HOME_BG_URL})`)
    } else {
      root.style.removeProperty('--home-bg')
    }
    return () => {
      root.classList.remove('home-bg')
      root.style.removeProperty('--home-bg')
    }
  }, [screen, ready, showSplash])

  const finishSplash = useCallback(() => setShowSplash(false), [])

  const goHome = () => setScreen('home')
  const showTabs = !showSplash && ready && (screen === 'home' || screen === 'us')
  const homeBg = screen === 'home'

  return (
    <div
      className={`app${homeBg ? ' app--home-bg' : ''}`}
      style={homeBg ? { ['--home-bg' as string]: `url(${HOME_BG_URL})` } : undefined}
    >
      {showSplash ? (
        <SplashIntro canFinish={ready} onDone={finishSplash} />
      ) : null}

      {ready ? (
        <>
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
            <nav className={`tabbar${screen === 'home' ? ' tabbar--clear' : ''}`} aria-label="Main">
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
        </>
      ) : null}
    </div>
  )
}
