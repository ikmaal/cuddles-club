const INTERACTIVE_SELECTOR =
  'input, textarea, select, option, [contenteditable="true"], [contenteditable=""]'

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR))
}

/** Block touch scrolling on a fixed shell (e.g. home). */
export function bindScrollLock(element: HTMLElement): () => void {
  const onTouchMove = (event: TouchEvent) => {
    if (isInteractive(event.target)) return
    event.preventDefault()
  }

  element.addEventListener('touchmove', onTouchMove, { passive: false })
  return () => element.removeEventListener('touchmove', onTouchMove)
}

/** Stop iOS rubber-band when a scroll region is already at an edge. */
export function bindOverscrollContain(element: HTMLElement): () => void {
  let startY = 0

  const onTouchStart = (event: TouchEvent) => {
    startY = event.touches[0]?.clientY ?? 0
  }

  const onTouchMove = (event: TouchEvent) => {
    if (isInteractive(event.target)) return

    const y = event.touches[0]?.clientY ?? 0
    const delta = y - startY
    const { scrollTop, scrollHeight, clientHeight } = element
    const atTop = scrollTop <= 0
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1

    if ((atTop && delta > 0) || (atBottom && delta < 0)) {
      event.preventDefault()
    }
  }

  element.addEventListener('touchstart', onTouchStart, { passive: true })
  element.addEventListener('touchmove', onTouchMove, { passive: false })

  return () => {
    element.removeEventListener('touchstart', onTouchStart)
    element.removeEventListener('touchmove', onTouchMove)
  }
}

function isInsideScrollRegion(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false

  let node: Element | null = target
  while (node && node !== document.documentElement) {
    if (node instanceof HTMLElement) {
      // Home manages its own touch lock.
      if (node.classList.contains('home')) return true

      const { overflowY } = window.getComputedStyle(node)
      const scrollable =
        overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'
      if (scrollable && node.scrollHeight > node.clientHeight + 1) {
        return true
      }
    }
    node = node.parentElement
  }

  return false
}

/** Prevent document-level pull on iOS when touch is outside scroll regions. */
export function bindDocumentOverscrollLock(): () => void {
  const onTouchMove = (event: TouchEvent) => {
    if (isInteractive(event.target)) return
    if (isInsideScrollRegion(event.target)) return
    event.preventDefault()
  }

  document.addEventListener('touchmove', onTouchMove, { passive: false })
  return () => document.removeEventListener('touchmove', onTouchMove)
}
