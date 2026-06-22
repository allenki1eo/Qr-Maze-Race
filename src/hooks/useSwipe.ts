import { useEffect, useRef, useCallback } from 'react'
import type { Direction } from './useGameLoop'

const SWIPE_THRESHOLD = 35

export function useSwipe(
  onSwipe: (dir: Direction) => void,
  elementRef: React.RefObject<HTMLElement | null>
) {
  const startRef = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const t = e.touches[0]
    startRef.current = { x: t.clientX, y: t.clientY }
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!startRef.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - startRef.current.x
    const dy = t.clientY - startRef.current.y
    startRef.current = null

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > SWIPE_THRESHOLD) onSwipe(dx > 0 ? 'E' : 'W')
    } else {
      if (Math.abs(dy) > SWIPE_THRESHOLD) onSwipe(dy > 0 ? 'S' : 'N')
    }
  }, [onSwipe])

  useEffect(() => {
    const el = elementRef.current
    if (!el) return
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [elementRef, handleTouchStart, handleTouchEnd])
}
