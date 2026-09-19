import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { shakeError } from '@/lib/animation/presets'
import { playFail } from '@/lib/sound/sfx'
import type { ReactionPhase } from './useReactionTimeSolo'

interface ReactionTimeBoardProps {
  phase: ReactionPhase
  round: number
  totalRounds: number
  lastMs?: number
  onStart: () => void
  onTap: () => void
}

const PHASE_STYLES: Record<string, string> = {
  idle: 'bg-surface-raised',
  waiting: 'bg-[#3a1210]',
  tooSoon: 'bg-[#3a1210]',
  go: 'bg-[#16a34a]',
  roundResult: 'bg-surface-raised',
}

export function ReactionTimeBoard({ phase, round, totalRounds, lastMs, onStart, onTap }: ReactionTimeBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (phase === 'tooSoon') {
      playFail()
      shakeError(boardRef.current)
    }
  }, [phase])

  const handleClick = () => {
    if (phase === 'idle') {
      onStart()
      return
    }
    onTap()
  }

  return (
    <div
      ref={boardRef}
      onClick={handleClick}
      className={`flex h-96 select-none flex-col items-center justify-center gap-3 rounded-3xl border border-border
        text-center transition-[background-color] duration-0 cursor-pointer ${PHASE_STYLES[phase]}`}
    >
      {phase === 'idle' && (
        <>
          <p className="font-display text-xl font-semibold lowercase tracking-tight text-text">Reaction Time</p>
          <p className="max-w-xs text-sm text-text-muted">
            When the box turns green, click as fast as you can. Click anywhere to start.
          </p>
        </>
      )}
      {phase === 'waiting' && (
        <>
          <p className="font-display text-2xl font-semibold text-white">Wait for green...</p>
          <p className="font-mono text-sm text-white/70">
            round {round}/{totalRounds}
          </p>
        </>
      )}
      {phase === 'tooSoon' && (
        <>
          <p className="font-display text-2xl font-semibold text-white">Too soon!</p>
          <p className="text-sm text-white/70">Click to try again</p>
        </>
      )}
      {phase === 'go' && <p className="font-display text-4xl font-bold text-white">CLICK!</p>}
      {phase === 'roundResult' && (
        <>
          <p className="font-mono text-4xl font-bold tabular-nums text-text">{lastMs} ms</p>
          <p className="text-sm text-text-muted">
            {round >= totalRounds ? 'Click to see results' : `Click to continue — round ${round + 1} of ${totalRounds}`}
          </p>
        </>
      )}
    </div>
  )
}
