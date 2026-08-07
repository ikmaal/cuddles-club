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
const HOME_STATUS_COLOR = '#272d88'
const SPLASH_STATUS_COLOR = '#ffffff'
const DEFAULT_THEME_COLOR = '#E85D75'

function setThemeColor(color: string) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
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
  const [showSplash, setShowSplash] = useState(true)
  const [homeBgReady, setHomeBgReady] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.src = HOME_BG_URL
    const markReady = () => setHomeBgReady(true)
    if (img.complete) {
      markReady()
      return
    }
    img.onload = markReady
    img.onerror = markReady
  }, [])

  useEffect(() => {
    const wallpaperLive = screen === 'home' && homeBgReady && !showSplash
    const root = document.documentElement
    const statusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')

    root.classList.toggle('splash-active', showSplash)
    root.classList.toggle('home-bg', wallpaperLive)

    if (wallpaperLive) {
      root.style.setProperty('--home-bg', `url(${HOME_BG_URL})`)
      setThemeColor(HOME_STATUS_COLOR)
      statusBar?.setAttribute('content', 'black-translucent')
    } else if (showSplash) {
      root.style.removeProperty('--home-bg')
      setThemeColor(SPLASH_STATUS_COLOR)
      statusBar?.setAttribute('content', 'default')
    } else if (screen === 'home') {
      root.style.removeProperty('--home-bg')
      setThemeColor(SPLASH_STATUS_COLOR)
      statusBar?.setAttribute('content', 'default')
    } else {
      root.style.removeProperty('--home-bg')
      setThemeColor(DEFAULT_THEME_COLOR)
      statusBar?.setAttribute('content', 'default')
    }
  }, [screen, homeBgReady, showSplash])

  const finishSplash = useCallback(() => setShowSplash(false), [])

  const goToScreen = useCallback((next: Screen) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    setScreen(next)
  }, [])

  const goHome = () => goToScreen('home')
  const showTabs = !showSplash && ready && (screen === 'home' || screen === 'us')
  const wallpaperLive = screen === 'home' && homeBgReady && !showSplash

  return (
    <div
      className={`app${wallpaperLive ? ' app--home-bg' : ''}${showSplash ? ' app--splash' : ''}`}
      style={wallpaperLive ? { ['--home-bg' as string]: `url(${HOME_BG_URL})` } : undefined}
    >
      {showSplash ? (
        <SplashIntro canFinish={ready && homeBgReady} onDone={finishSplash} />
      ) : null}

      {ready ? (
        <>
          <main className={`app__main ${showTabs ? 'has-tabs' : ''}`}>
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
            <nav className={`tabbar${screen === 'home' ? ' tabbar--clear' : ''}`} aria-label="Main">
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
