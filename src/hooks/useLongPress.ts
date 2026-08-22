import { useCallback, useRef, useState } from 'react'

const MOVE_CANCEL_PX = 10
const HOLD_MS = 460

export function useLongPress(onOpen: () => void, onMenu: () => void) {
  const timer = useRef(0)
  const origin = useRef<{ x: number; y: number } | null>(null)
  const menuOpened = useRef(false)
  const cancelled = useRef(false)
  const [holding, setHolding] = useState(false)

  const clear = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = 0
    origin.current = null
    setHolding(false)
  }, [])

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      menuOpened.current = false
      cancelled.current = false
      origin.current = { x: event.clientX, y: event.clientY }
      setHolding(true)
      event.currentTarget.setPointerCapture(event.pointerId)
      timer.current = window.setTimeout(() => {
        menuOpened.current = true
        setHolding(false)
        try {
          navigator.vibrate?.(12)
        } catch {
          /* ignore */
        }
        onMenu()
      }, HOLD_MS)
    },
    [onMenu],
  )

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!origin.current || menuOpened.current) return
      const dx = event.clientX - origin.current.x
      const dy = event.clientY - origin.current.y
      if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
        cancelled.current = true
        try {
          event.currentTarget.releasePointerCapture(event.pointerId)
        } catch {
          /* already released */
        }
        clear()
      }
    },
    [clear],
  )

  const onPointerUp = useCallback(() => {
    const opened = menuOpened.current
    const skipped = cancelled.current
    clear()
    if (!opened && !skipped) onOpen()
    menuOpened.current = false
    cancelled.current = false
  }, [clear, onOpen])

  const onPointerCancel = useCallback(() => {
    clear()
    menuOpened.current = false
    cancelled.current = true
  }, [clear])

  const onContextMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault()
      clear()
      menuOpened.current = true
      onMenu()
    },
    [clear, onMenu],
  )

  return {
    holding,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onContextMenu,
    },
  }
}
