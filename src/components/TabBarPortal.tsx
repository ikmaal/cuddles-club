import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface TabBarPortalProps {
  children: ReactNode
}

/** Render the tab bar on document.body so position:fixed is always viewport-relative. */
export function TabBarPortal({ children }: TabBarPortalProps) {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}
