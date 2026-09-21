import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useTheme } from '@/hooks/useTheme'

const STATUS_STEPS = ['booting', 'calibrating', 'tap to start']
const AUTO_DISMISS_MS = 6000

interface AppLoaderProps {
  onDone: () => void
}

export function AppLoader({ onDone }: AppLoaderProps) {
  const { theme } = useTheme()
  const [exiting, setExiting] = useState(false)
  const [statusIndex, setStatusIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLImageElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const dismissedRef = useRef(false)

  useGSAP(() => {
    const tl = gsap.timeline()
    tl.fromTo(logoRef.current, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'dialedOut' })
      .fromTo(
        barRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.6, ease: 'power2.out', transformOrigin: 'left center' },
        '<0.05',
      )
    return () => {
      tl.kill()
    }
  }, [])

  useEffect(() => {
    const t1 = setTimeout(() => setStatusIndex(1), 380)
    const t2 = setTimeout(() => setStatusIndex(2), 780)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  useEffect(() => {
    const dismiss = () => {
      if (dismissedRef.current) return
      dismissedRef.current = true
      setExiting(true)
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', dismiss)
    const fallback = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', dismiss)
      clearTimeout(fallback)
    }
  }, [])

  useGSAP(() => {
    if (!exiting) return
    gsap.to(rootRef.current, {
      opacity: 0,
      scale: 1.03,
      duration: 0.32,
      ease: 'power2.in',
      onComplete: onDone,
    })
  }, [exiting])

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-canvas"
      aria-hidden="true"
    >
      <img
        ref={logoRef}
        src={theme === 'dark' ? '/logo-dark.svg' : '/logo.svg'}
        alt=""
        className="h-10 w-auto opacity-0"
      />
      <div ref={barRef} className="h-px w-24 origin-left scale-x-0 bg-signal" />
      <div className="flex items-center gap-2">
        <span className="live-loop h-1.5 w-1.5 rounded-full bg-signal shadow-[0_0_10px_1px_var(--color-signal)]" />
        <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase tabular-nums">
          {STATUS_STEPS[statusIndex]}
        </span>
      </div>
    </div>
  )
}
