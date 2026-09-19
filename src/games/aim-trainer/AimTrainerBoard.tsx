import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { Button } from '@/components/ui/Button'
import { pulseGlow } from '@/lib/animation/presets'
import { playFail, playStreak } from '@/lib/sound/sfx'
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
      <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-surface-raised p-6 text-center">
        <p className="font-display text-xl font-semibold lowercase tracking-tight text-text">Aim Trainer</p>
        <p className="max-w-xs text-sm text-text-muted">Hit all {totalTargets} targets as fast as you can.</p>
        <Button onClick={onStart} chevron>
          Start
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1 font-mono text-sm text-text-muted">
        <span className="tabular-nums">
          {hits}/{totalTargets} hit
        </span>
        <span ref={streakRef} className="font-semibold text-accent-aim tabular-nums">
          streak {streak}
        </span>
      </div>
      <div
        onClick={onMiss}
        className="relative h-96 cursor-crosshair overflow-hidden rounded-3xl border border-border bg-surface-raised"
      >
        {target && <Target key={`${target.x}-${target.y}`} x={target.x} y={target.y} onHit={onHit} />}
      </div>
    </div>
  )
}
