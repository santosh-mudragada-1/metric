import gsap from 'gsap'
import { DURATION, EASE } from './gsapConfig'

type Target = gsap.TweenTarget

export function popIn(target: Target, opts: { delay?: number } = {}) {
  return gsap.fromTo(
    target,
    { scale: 0.6, opacity: 0 },
    { scale: 1, opacity: 1, duration: DURATION.slow, ease: EASE.out, delay: opts.delay ?? 0 },
  )
}

export function pressDown(target: Target) {
  return gsap.to(target, { scale: 0.94, duration: DURATION.instant, ease: EASE.smooth })
}

export function pressUp(target: Target) {
  return gsap.to(target, { scale: 1, duration: DURATION.base, ease: EASE.out })
}

export function hoverIn(target: Target) {
  return gsap.to(target, { scale: 1.03, duration: DURATION.fast, ease: EASE.smooth })
}

export function hoverOut(target: Target) {
  return gsap.to(target, { scale: 1, duration: DURATION.fast, ease: EASE.smooth })
}

export function shakeError(target: Target) {
  const tl = gsap.timeline()
  tl.to(target, { x: -8, duration: 0.05, ease: 'power1.inOut' })
    .to(target, { x: 8, duration: 0.08, ease: 'power1.inOut' })
    .to(target, { x: -6, duration: 0.08, ease: 'power1.inOut' })
    .to(target, { x: 0, duration: 0.08, ease: 'power1.inOut' })
  return tl
}

export function flashSuccess(target: Target) {
  const tl = gsap.timeline()
  tl.to(target, { scale: 1.08, duration: DURATION.fast, ease: EASE.out }).to(target, {
    scale: 1,
    duration: DURATION.base,
    ease: EASE.smooth,
  })
  return tl
}

export function countdownPulse(target: Target) {
  return gsap.fromTo(
    target,
    { scale: 1.5, opacity: 0 },
    { scale: 1, opacity: 1, duration: DURATION.base, ease: EASE.out },
  )
}

export function staggerReveal(
  targets: Element[] | NodeListOf<Element>,
  opts: {
    stagger?: number
    duration?: number
    from?: gsap.TweenVars
    to?: gsap.TweenVars
    onEach?: (index: number) => void
    onDone?: () => void
  } = {},
) {
  const { stagger = 0.12, duration = DURATION.base, from = { opacity: 0, scale: 0.7 }, to = {}, onEach, onDone } = opts
  const list = Array.from(targets)
  const tl = gsap.timeline({ onComplete: onDone })
  list.forEach((el, i) => {
    tl.fromTo(
      el,
      from,
      {
        opacity: 1,
        scale: 1,
        duration,
        ease: EASE.out,
        onStart: () => onEach?.(i),
        ...to,
      },
      i * stagger,
    )
  })
  return tl
}

/** Animates the text content of `target` from `from` to `to` as a tabular-nums count-up. */
export function countUp(
  target: Target,
  opts: { from?: number; to: number; duration?: number; suffix?: string; onDone?: () => void },
) {
  const { from = 0, to, duration = DURATION.slow, suffix = '', onDone } = opts
  const proxy = { value: from }
  return gsap.to(proxy, {
    value: to,
    duration,
    ease: EASE.snap,
    onUpdate: () => {
      const el = (Array.isArray(target) ? target[0] : target) as HTMLElement | null
      if (el) el.textContent = `${Math.round(proxy.value)}${suffix}`
    },
    onComplete: onDone,
  })
}

/** Dashboard content exiting toward a selected game — pairs with `enterMode`. */
export function exitToMode(target: Target) {
  return gsap.to(target, { opacity: 0, y: -16, scale: 0.98, duration: DURATION.base, ease: EASE.in })
}

/** Game surface arriving after a mode transition. */
export function enterMode(target: Target) {
  return gsap.fromTo(
    target,
    { opacity: 0, y: 20, scale: 0.98 },
    { opacity: 1, y: 0, scale: 1, duration: DURATION.transition, ease: EASE.out },
  )
}

export function pulseGlow(target: Target) {
  const tl = gsap.timeline()
  tl.to(target, { filter: 'brightness(1.5)', duration: DURATION.fast, ease: EASE.out }).to(target, {
    filter: 'brightness(1)',
    duration: DURATION.slow,
    ease: EASE.smooth,
  })
  return tl
}
