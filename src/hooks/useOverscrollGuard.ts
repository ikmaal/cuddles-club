import { useEffect, useRef } from 'react'
import { bindOverscrollContain, bindScrollLock } from '../lib/overscroll'

export function useOverscrollGuard<T extends HTMLElement>(scrollable: boolean) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    return scrollable ? bindOverscrollContain(element) : bindScrollLock(element)
  }, [scrollable])

  return ref
}
