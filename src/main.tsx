import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { CoupleProvider } from './context/CoupleContext'
import './index.css'

const homeBgUrl = `${import.meta.env.BASE_URL}background.png`
const preload = document.createElement('link')
preload.rel = 'preload'
preload.as = 'image'
preload.href = homeBgUrl
document.head.appendChild(preload)
new Image().src = homeBgUrl

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CoupleProvider>
      <App />
    </CoupleProvider>
  </StrictMode>,
)
