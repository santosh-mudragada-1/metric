import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { Button } from '@/components/ui/Button'
import { pulseGlow } from '@/lib/animation/presets'
import { playFail, playStreak } from '@/lib/sound/sfx'
import { AimPreview } from '@/components/previews/AimPreview'
import { Target } from './Target'
import type { AimPhase } from './useAimTrainerSolo'

interface AimTrainerBoardProps {
  phase: AimPhase
  target: { x: number; y: number } | null
  hits: number
  totalTargets: number
  streak: number
  onStart: () => void
  onHit: () => void
  onMiss: () => void
}

export function AimTrainerBoard({ phase, target, hits, totalTargets, streak, onStart, onHit, onMiss }: AimTrainerBoardProps) {
  const streakRef = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    if (phase !== 'playing') return
    if (streak > 0 && streak % 5 === 0) {
      pulseGlow(streakRef.current)
      playStreak(streak)
    } else if (streak === 0 && hits > 0) {
      playFail()
    }
  }, [streak])

  if (phase === 'idle') {
    return (
      <div className="relative flex h-[65vh] min-h-96 max-h-[38rem] flex-col items-center justify-center gap-4 overflow-hidden rounded-panel border border-border bg-surface text-center">
        <div className="absolute top-5 left-5 flex items-center gap-2 sm:top-7 sm:left-7">
          <span className="h-2 w-2 rounded-full bg-text-dim" />
          <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">standby</span>
        </div>
        <div className="mb-2 h-12 w-12 opacity-80">
          <AimPreview />
        </div>
        <p className="font-display text-2xl font-semibold lowercase tracking-tight text-text">aim trainer</p>
        <p className="max-w-xs text-sm leading-relaxed text-text-muted">Hit all {totalTargets} targets as fast as you can.</p>
        <Button onClick={onStart} chevron className="mt-2">
          Start
        </Button>
      </div>
    )
  }

  return (
    <div
      onPointerDown={(e) => e.button === 0 && onMiss()}
      className="relative h-[65vh] min-h-96 max-h-[38rem] cursor-crosshair overflow-hidden rounded-panel border border-border bg-surface"
    >
      <div className="pointer-events-none absolute top-5 left-5 flex items-center gap-2 sm:top-7 sm:left-7">
        <span className="live-loop h-2 w-2 rounded-full bg-accent-aim shadow-[0_0_10px_1px_var(--color-accent-aim)]" />
        <span className="font-mono text-[0.6875rem] tabular-nums tracking-[0.14em] text-text-dim uppercase">
          {hits} / {totalTargets} hit
        </span>
      </div>
      <div className="pointer-events-none absolute top-5 right-5 font-mono text-sm text-text-dim sm:top-7 sm:right-7">
        <span ref={streakRef} className="font-semibold tracking-[0.14em] text-accent-aim uppercase tabular-nums">
          streak {streak}
        </span>
      </div>
      {target && <Target key={`${target.x}-${target.y}`} x={target.x} y={target.y} onHit={onHit} />}
    </div>
  )
}
