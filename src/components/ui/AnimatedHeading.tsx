import { Fragment, type CSSProperties, useRef } from 'react'
import gsap from 'gsap'
import { useAnimation } from '@/hooks/useAnimation'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { DURATION, EASE } from '@/lib/animation/gsapConfig'
import { playHeadingHover, playHeadingTick } from '@/lib/sound/sfx'

const TICK_MIN_INTERVAL = 55
const TICK_INFLUENCE_THRESHOLD = 0.15

type HeadingTag = 'h1' | 'h2' | 'h3'

interface AnimatedHeadingProps {
  as?: HeadingTag
  text: string
  className?: string
  /** Rest weight on the `wght` axis — should match the surrounding font-weight utility. */
  weight?: number
  /** Weight the letter under the cursor reaches. */
  hoverWeight?: number
  /** Rest width on the `wdth` axis (Google Sans Flex only goes up to 100/normal). */
  width?: number
  /** Width the letter under the cursor reaches — lower reads as a condensed, impact state. */
  hoverWidth?: number
  /** How far the effect reaches from the cursor, in px. */
  radius?: number
}

const letterStyle: CSSProperties = { display: 'inline-block', whiteSpace: 'pre' }

export function AnimatedHeading({
  as = 'h1',
  text,
  className = '',
  weight = 600,
  hoverWeight = 850,
  width = 100,
  hoverWidth = 86,
  radius = 140,
}: AnimatedHeadingProps) {
  const Tag = as
  const { scope, run } = useAnimation<HTMLHeadingElement>()
  const reducedMotion = usePrefersReducedMotion()
  const lastTickTime = useRef(0)
  const lastTickIndex = useRef(-1)
  const isHovering = useRef(false)

  const fvs = (wght: number, wdth: number) => `'wght' ${wght}, 'wdth' ${wdth}`
  const lines = text.split('\n')

  if (reducedMotion) {
    return (
      <Tag className={className} style={{ fontVariationSettings: fvs(weight, width) }}>
        {text.replace(/\n/g, ' ')}
      </Tag>
    )
  }

  const registerLetter = (el: HTMLSpanElement | null) => {
    if (!el) return
    el.style.fontVariationSettings = fvs(weight, width)
  }

  const onMove = run((e: React.PointerEvent<HTMLHeadingElement>) => {
    if (!isHovering.current) {
      isHovering.current = true
      playHeadingHover()
    }

    const spans = scope.current?.querySelectorAll<HTMLSpanElement>('[data-letter]')
    if (!spans) return
    let closestIndex = -1
    let closestInfluence = 0
    spans.forEach((el, index) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const distance = Math.hypot(e.clientX - cx, e.clientY - cy)
      const influence = distance < radius ? (Math.cos((distance / radius) * Math.PI) + 1) / 2 : 0
      const targetWght = weight + influence * (hoverWeight - weight)
      const targetWdth = width + influence * (hoverWidth - width)
      const state = { wght: Number(el.dataset.wght ?? weight), wdth: Number(el.dataset.wdth ?? width) }
      gsap.to(state, {
        wght: targetWght,
        wdth: targetWdth,
        duration: DURATION.base,
        ease: EASE.smooth,
        overwrite: true,
        onUpdate: () => {
          el.dataset.wght = String(state.wght)
          el.dataset.wdth = String(state.wdth)
          el.style.fontVariationSettings = fvs(state.wght, state.wdth)
        },
      })
      if (influence > closestInfluence) {
        closestInfluence = influence
        closestIndex = index
      }
    })

    const now = performance.now()
    if (
      closestIndex >= 0 &&
      closestIndex !== lastTickIndex.current &&
      closestInfluence > TICK_INFLUENCE_THRESHOLD &&
      now - lastTickTime.current > TICK_MIN_INTERVAL
    ) {
      lastTickTime.current = now
      lastTickIndex.current = closestIndex
      playHeadingTick(closestIndex)
    }
  })

  const onLeave = run(() => {
    isHovering.current = false
    lastTickIndex.current = -1
    const spans = scope.current?.querySelectorAll<HTMLSpanElement>('[data-letter]')
    if (!spans) return
    spans.forEach((el) => {
      const state = { wght: Number(el.dataset.wght ?? weight), wdth: Number(el.dataset.wdth ?? width) }
      gsap.to(state, {
        wght: weight,
        wdth: width,
        duration: DURATION.slow,
        ease: EASE.smooth,
        overwrite: true,
        onUpdate: () => {
          el.dataset.wght = String(state.wght)
          el.dataset.wdth = String(state.wdth)
          el.style.fontVariationSettings = fvs(state.wght, state.wdth)
        },
      })
    })
  })

  return (
    <Tag ref={scope} className={className} onPointerMove={onMove} onPointerLeave={onLeave}>
      <span className="sr-only">{text.replace(/\n/g, ' ')}</span>
      <span aria-hidden="true">
        {lines.map((line, li) => (
          <Fragment key={li}>
            {li > 0 && <br />}
            {line.split('').map((ch, ci) => (
              <span key={ci} data-letter ref={registerLetter} style={letterStyle}>
                {ch}
              </span>
            ))}
          </Fragment>
        ))}
      </span>
    </Tag>
  )
}
