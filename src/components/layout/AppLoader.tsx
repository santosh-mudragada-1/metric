import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useTheme } from '@/hooks/useTheme'

interface AppLoaderProps {
  onDone: () => void
}

export function AppLoader({ onDone }: AppLoaderProps) {
  const { theme } = useTheme()
  const rootRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLImageElement>(null)
  const ring1Ref = useRef<HTMLDivElement>(null)
  const ring2Ref = useRef<HTMLDivElement>(null)
  const sweepRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({ onComplete: onDone })

    tl.fromTo(
      logoRef.current,
      { scale: 0.3, opacity: 0, rotate: -14, clipPath: 'inset(0 100% 0 0)' },
      { scale: 1, opacity: 1, rotate: 0, clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'dialedOut' },
      0,
    )
      .fromTo(
        sweepRef.current,
        { xPercent: -140, opacity: 0.9 },
        { xPercent: 140, opacity: 0, duration: 0.5, ease: 'power2.in' },
        0.15,
      )
      .fromTo(
        [ring1Ref.current, ring2Ref.current],
        { scale: 0.5, opacity: 0.5 },
        { scale: 2.2, opacity: 0, duration: 0.9, ease: 'power2.out', stagger: 0.18 },
        0.1,
      )
      .to(rootRef.current, { opacity: 0, scale: 1.04, duration: 0.35, ease: 'power2.in' }, '+=0.3')

    return () => {
      tl.kill()
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-canvas"
      aria-hidden="true"
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div ref={ring1Ref} className="absolute inset-0 rounded-full border border-signal" />
        <div ref={ring2Ref} className="absolute inset-0 rounded-full border border-signal" />
        <div className="relative inline-block overflow-hidden">
          <img
            ref={logoRef}
            src={theme === 'dark' ? '/logo-dark.svg' : '/logo.svg'}
            alt=""
            className="h-10 w-auto opacity-0"
          />
          <div
            ref={sweepRef}
            className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-signal/70 to-transparent opacity-0"
          />
        </div>
      </div>
    </div>
  )
}
