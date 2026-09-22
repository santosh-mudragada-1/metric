import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { usePostHog } from '@posthog/react'
import gsap from 'gsap'
import { Button } from '@/components/ui/Button'
import { AuthModal } from './AuthModal'

interface EntryGateProps {
  onResolved: () => void
}

/**
 * Shown once per fresh page load, right after the splash finishes. Doubles as the
 * app's first real user gesture — a page can't play audio before one, on any
 * browser, so this doubles as the natural place to unlock sound rather than
 * relying on whatever the player happens to click first inside a game.
 */
export function EntryGate({ onResolved }: EntryGateProps) {
  const posthog = usePostHog()
  const [authOpen, setAuthOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const resolvedRef = useRef(false)

  useGSAP(() => {
    gsap.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, y: 16, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'dialedOut', delay: 0.05 },
    )
  }, [])

  const finish = () => {
    if (resolvedRef.current) return
    resolvedRef.current = true
    gsap.to(rootRef.current, { opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: onResolved })
  }

  return (
    <>
      <div
        ref={rootRef}
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-40 flex items-center justify-center bg-canvas/95 p-4 backdrop-blur-sm"
      >
        <div
          ref={panelRef}
          className="w-full max-w-sm rounded-panel border border-border-strong bg-surface-raised p-7 text-center shadow-[var(--shadow-card)]"
        >
          <p className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">welcome</p>
          <h2 className="mt-3 font-display text-xl font-semibold text-text">Sign in to save your scores</h2>
          <p className="mt-2 text-sm text-text-muted">Or jump straight in — you can always sign in later.</p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button variant="primary" size="lg" onClick={() => setAuthOpen(true)} className="w-full">
              Sign in
            </Button>
            <button
              type="button"
              onClick={() => {
                posthog?.capture('guest_mode_selected')
                finish()
              }}
              className="cursor-pointer py-2 font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase
                hover:text-text-muted"
            >
              Play as guest
            </button>
          </div>
        </div>
      </div>
      <AuthModal
        open={authOpen}
        onClose={() => {
          setAuthOpen(false)
          finish()
        }}
      />
    </>
  )
}
