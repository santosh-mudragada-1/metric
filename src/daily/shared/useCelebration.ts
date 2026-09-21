import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Delays a daily game's `complete()` call by a short puzzle-specific animation so the solved
 * board stays visible and settles before the result card swaps in — instead of the board
 * disappearing the instant the last move lands.
 */
export function useCelebration(onDone: () => void) {
  const [celebrating, setCelebrating] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const trigger = (durationMs: number) => {
    setCelebrating(true)
    const duration = prefersReducedMotion() ? 0 : durationMs
    timer.current = setTimeout(() => {
      setCelebrating(false)
      onDone()
    }, duration)
  }

  return { celebrating, trigger }
}
