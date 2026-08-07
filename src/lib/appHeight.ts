/** Measure layout height + safe-area for iOS standalone PWAs. */
export function bindAppHeight() {
  let probe: HTMLDivElement | null = null

  const ensureProbe = () => {
    if (probe?.isConnected) return probe

    probe = document.createElement('div')
    probe.id = 'safe-bottom-probe'
    probe.setAttribute('aria-hidden', 'true')
    probe.style.cssText =
      'position:fixed;bottom:0;left:0;width:0;height:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none;'
    document.body.appendChild(probe)
    return probe
  }

  const set = () => {
    const vv = window.visualViewport
    const layoutHeight = Math.max(
      window.innerHeight,
      document.documentElement.clientHeight,
      vv?.height ?? 0,
    )

    const safeBottom = ensureProbe().offsetHeight
    const fullHeight = layoutHeight + safeBottom

    document.documentElement.style.setProperty('--safe-bottom-px', `${safeBottom}px`)
    document.documentElement.style.setProperty('--app-height', `${layoutHeight}px`)
    document.documentElement.style.setProperty('--screen-height', `${fullHeight}px`)
  }

  set()
  window.addEventListener('resize', set)
  window.addEventListener('orientationchange', set)
  window.visualViewport?.addEventListener('resize', set)
  window.visualViewport?.addEventListener('scroll', set)

  return () => {
    window.removeEventListener('resize', set)
    window.removeEventListener('orientationchange', set)
    window.visualViewport?.removeEventListener('resize', set)
    window.visualViewport?.removeEventListener('scroll', set)
    probe?.remove()
    probe = null
  }
}
