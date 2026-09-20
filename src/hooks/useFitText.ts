import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Shrinks a single line of text to keep it inside its container as `content` grows (e.g. number
 * memory's digit string gaining a character every round) — measures the rendered width against
 * the container each time content changes and scales the font size down to fit, never up past `maxRem`.
 */
export function useFitText(content: string, maxRem: number, minRem: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLElement>(null)
  const [fontSize, setFontSize] = useState(maxRem)

  useLayoutEffect(() => {
    const container = containerRef.current
    const text = textRef.current
    if (!container || !text) return

    const fit = () => {
      const currentPx = parseFloat(getComputedStyle(text).fontSize)
      const available = container.clientWidth
      const natural = text.scrollWidth
      if (!currentPx || !natural || !available) return
      const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const idealRem = (currentPx * (available / natural)) / rootPx
      setFontSize(Math.min(maxRem, Math.max(minRem, idealRem)))
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(container)
    return () => ro.disconnect()
  }, [content, maxRem, minRem])

  return { containerRef, textRef, fontSize }
}
