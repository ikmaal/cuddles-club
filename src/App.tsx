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

const NAVY = '#272d88'
const SPLASH_STATUS_COLOR = '#ffffff'
const DEFAULT_THEME_COLOR = '#E85D75'

type SplashPhase = 'active' | 'exiting' | 'done'

function setThemeColor(color: string) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
}

function setStatusBarStyle(style: 'default' | 'black-translucent') {
  document
    .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    ?.setAttribute('content', style)
}

const TABS: { id: Screen; label: string; Icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'us', label: 'Us', Icon: HeartIcon },
]

export default function App() {
  const { ready } = useCouple()
  const { profile, updateProfile } = useProfile()
  const strips = usePhotostrips()

  const [screen, setScreen] = useState<Screen>('home')
  const [splashPhase, setSplashPhase] = useState<SplashPhase>('active')
  const [homeVisible, setHomeVisible] = useState(false)

  const splashActive = splashPhase !== 'done'
  const navyLive = (screen === 'home' || screen === 'us') && splashPhase === 'done'
  const shellVisible = screen === 'us' ? navyLive : homeVisible
  const showTabs = !splashActive && ready && (screen === 'home' || screen === 'us')

  useEffect(() => {
    const root = document.documentElement

    root.classList.toggle('splash-active', splashActive)
    root.classList.toggle('home-bg', navyLive)

    if (navyLive) {
      setThemeColor(NAVY)
      setStatusBarStyle('black-translucent')
    } else if (splashActive) {
      setThemeColor(SPLASH_STATUS_COLOR)
      setStatusBarStyle('default')
    } else {
      setThemeColor(DEFAULT_THEME_COLOR)
      setStatusBarStyle('default')
    }
  }, [splashActive, navyLive])

  useEffect(() => {
    if (screen !== 'home' || splashPhase !== 'done') {
      setHomeVisible(false)
      return
    }

    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setHomeVisible(true))
    })

    return () => {
      cancelAnimationFrame(raf1)
      if (raf2) cancelAnimationFrame(raf2)
    }
  }, [screen, splashPhase])

  const handleSplashExiting = useCallback(() => setSplashPhase('exiting'), [])
  const finishSplash = useCallback(() => setSplashPhase('done'), [])

  const goToScreen = useCallback((next: Screen) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    setScreen(next)
  }, [])

  const goHome = () => goToScreen('home')

  return (
    <div
      className={`app${navyLive ? ' app--home-bg' : ''}${shellVisible ? ' app--home-visible' : ''}${splashActive ? ' app--splash' : ''}`}
    >
      {splashActive ? (
        <SplashIntro
          canFinish={ready}
          onExiting={handleSplashExiting}
          onDone={finishSplash}
        />
      ) : null}

      {ready ? (
        <>
          <main className="app__main">
            {screen === 'home' ? (
              <HomeScreen profile={profile} onOpen={goToScreen} />
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
            <nav className="tabbar tabbar--clear" aria-label="Main">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`tabbar__item ${screen === tab.id ? 'is-active' : ''}`}
                  onClick={() => goToScreen(tab.id)}
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
