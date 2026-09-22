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
  // React state updates are asynchronous, so a pointer event that fires in the brief window
  // before a `celebrating: true` update commits can still read the stale `false` value — e.g. a
  // fast drag that overshoots the finishing cell by a pixel, dispatching one more pointermove
  // right on the heels of the one that completed the puzzle. This ref is mutated synchronously,
  // the instant `trigger` runs, so callers that guard interaction with it can't race it.
  const celebratingRef = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const trigger = (durationMs: number) => {
    if (celebratingRef.current) return
    celebratingRef.current = true
    setCelebrating(true)
    const duration = prefersReducedMotion() ? 0 : durationMs
    timer.current = setTimeout(() => {
      celebratingRef.current = false
      setCelebrating(false)
      onDone()
    }, duration)
  }

  return { celebrating, celebratingRef, trigger }
}
