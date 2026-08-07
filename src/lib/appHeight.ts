/** iOS PWA reports 100dvh shorter than the real screen — use innerHeight instead. */
export function bindAppHeight() {
  const set = () => {
    const height = window.visualViewport?.height ?? window.innerHeight
    document.documentElement.style.setProperty('--app-height', `${height}px`)
  }

  set()
  window.addEventListener('resize', set)
  window.visualViewport?.addEventListener('resize', set)
  window.visualViewport?.addEventListener('scroll', set)

  return () => {
    window.removeEventListener('resize', set)
    window.visualViewport?.removeEventListener('resize', set)
    window.visualViewport?.removeEventListener('scroll', set)
  }
}
