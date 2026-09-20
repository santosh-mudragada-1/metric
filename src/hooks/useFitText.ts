import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Shrinks text to keep it inside its container as `content` grows (e.g. number memory's digit
 * string gaining a character every round) — measures the widest rendered line against the
 * container each time content changes and scales the font size down to fit, never up past
 * `maxRem`. Font size is applied to the container (via the returned `fontSize`); one or more line
 * elements can be rendered as its direct children and they'll inherit it, which is what lets the
 * same hook fit either a single line or a manually-split multi-line layout.
 */
export function useFitText(content: string, maxRem: number, minRem: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(maxRem)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || container.children.length === 0) return

    const fit = () => {
      const currentPx = parseFloat(getComputedStyle(container).fontSize)
      const available = container.clientWidth
      const natural = Math.max(...Array.from(container.children, (el) => el.scrollWidth))
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

  return { containerRef, fontSize }
}
