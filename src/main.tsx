import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { CoupleProvider } from './context/CoupleContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CoupleProvider>
      <App />
    </CoupleProvider>
  </StrictMode>,
)
