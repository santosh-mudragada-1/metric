import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(CustomEase)

// A single "brand" overshoot curve used for every pop-in / press-release across
// the app so motion reads as one system rather than per-component one-offs.
CustomEase.create('dialedOut', 'M0,0 C0.34,1.56 0.64,1 1,1')
CustomEase.create('dialedIn', 'M0,0 C0.36,0 0.66,-0.56 1,1')

export const EASE = {
  out: 'dialedOut',
  in: 'dialedIn',
  smooth: 'power2.out',
  snap: 'power3.out',
} as const

export const DURATION = {
  instant: 0.08,
  fast: 0.12,
  base: 0.22,
  slow: 0.42,
  /** Route/mode transitions only — dashboard ↔ game, never a hover or press. */
  transition: 0.6,
} as const

let reducedMotionQuery: gsap.MatchMedia | null = null

export function registerReducedMotion(): void {
  if (reducedMotionQuery) return
  reducedMotionQuery = gsap.matchMedia()
  reducedMotionQuery.add('(prefers-reduced-motion: reduce)', () => {
    gsap.globalTimeline.timeScale(2.4)
  })
}
