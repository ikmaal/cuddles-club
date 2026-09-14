import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { CoupleProvider } from './context/CoupleContext'
import { SpotifyListeningProvider } from './context/SpotifyListeningContext'
import { bindAppHeight } from './lib/appHeight'
import { bindDocumentOverscrollLock } from './lib/overscroll'
import { isPushConfigured, registerServiceWorker } from './lib/pushNotifications'
import './index.css'

bindAppHeight()
bindDocumentOverscrollLock()

if (isPushConfigured()) {
  void registerServiceWorker()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CoupleProvider>
      <SpotifyListeningProvider>
        <App />
      </SpotifyListeningProvider>
    </CoupleProvider>
  </StrictMode>,
)
