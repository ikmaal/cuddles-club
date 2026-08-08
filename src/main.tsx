import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { CoupleProvider } from './context/CoupleContext'
import { bindAppHeight } from './lib/appHeight'
import { bindDocumentOverscrollLock } from './lib/overscroll'
import './index.css'

bindAppHeight()
bindDocumentOverscrollLock()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CoupleProvider>
      <App />
    </CoupleProvider>
  </StrictMode>,
)
