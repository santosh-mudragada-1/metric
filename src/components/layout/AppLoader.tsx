import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

interface AppLoaderProps {
  onDone: () => void
}

// An eight-step grey ramp (dark to light) — matches the app's ink/chalk-only
// system chrome instead of borrowing the colorful per-game accent palette.
const ACCENTS = ['#141414', '#363636', '#575757', '#787878', '#999999', '#bababa', '#dbdbdb', '#f2f2f2']

export function AppLoader({ onDone }: AppLoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLDivElement>(null)
  const barRefs = useRef<(HTMLDivElement | null)[]>([])
  const counterRef = useRef<HTMLSpanElement>(null)
  const counterWrapRef = useRef<HTMLDivElement>(null)
  const ruleFillRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const bars = barRefs.current.filter((el): el is HTMLDivElement => el !== null)
    gsap.set(bars, { scaleY: 0.05, transformOrigin: 'bottom center' })
    gsap.set(ruleFillRef.current, { scaleX: 0, transformOrigin: 'left center' })

    const idle = gsap.to(bars, {
      scaleY: 0.16,
      duration: 0.55,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      stagger: { each: 0.09, from: 'start' },
    })

    const counter = { value: 0 }
    const tl = gsap.timeline({ onComplete: onDone })

    tl.to(counter, {
      value: 100,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        const displayed = Math.round(counter.value)
        if (counterRef.current) counterRef.current.textContent = String(displayed).padStart(2, '0')
        gsap.set(ruleFillRef.current, { scaleX: displayed / 100 })
      },
    })
      .call(() => idle.kill())
      .to(counterWrapRef.current, { opacity: 0, y: -20, duration: 0.25, ease: 'power2.in' }, '<')
      .to(
        bars,
        { scaleY: 1, duration: 0.55, ease: 'power4.inOut', stagger: { each: 0.045, from: 'edges' } },
        '<',
      )
      .to(
        [...bars, baseRef.current],
        { yPercent: -100, duration: 0.65, ease: 'power4.inOut', stagger: { each: 0.045, from: 'edges' } },
        '+=0.18',
      )

    return () => {
      idle.kill()
      tl.kill()
    }
  }, [])

  return (
    <div ref={rootRef} className="fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
      <div ref={baseRef} className="absolute inset-0 bg-canvas" />
      <div className="absolute inset-0 flex">
        {ACCENTS.map((color, i) => (
          <div key={i} className="relative h-full flex-1">
            <div
              ref={(el) => {
                barRefs.current[i] = el
              }}
              className="absolute bottom-0 left-0 h-full w-full"
              style={{ backgroundColor: color }}
            />
          </div>
        ))}
      </div>
      <div className="relative flex h-full flex-col items-center justify-center">
        <div ref={counterWrapRef} className="flex flex-col items-center">
          <div className="flex items-end">
            <span
              ref={counterRef}
              className="font-display text-[clamp(4.5rem,20vw,12rem)] leading-none font-medium tracking-tight text-text tabular-nums"
            >
              00
            </span>
            <span className="mb-3 ml-1 font-display text-2xl text-text-dim sm:mb-5 sm:text-3xl">%</span>
          </div>
          <div className="relative mt-6 h-px w-40 overflow-hidden bg-border sm:w-56">
            <div ref={ruleFillRef} className="absolute inset-y-0 left-0 w-full bg-signal" />
          </div>
        </div>
      </div>
    </div>
  )
}
