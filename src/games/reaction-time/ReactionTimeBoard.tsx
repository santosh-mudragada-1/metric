import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { shakeError } from '@/lib/animation/presets'
import { playFail } from '@/lib/sound/sfx'
import { ReactionPreview } from '@/components/previews/ReactionPreview'
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
  idle: 'bg-surface',
  waiting: 'bg-[#170c0b]',
  tooSoon: 'bg-[#170c0b]',
  go: 'bg-success',
  roundResult: 'bg-surface',
}

const LED_STYLES: Record<string, string> = {
  idle: 'bg-text-dim',
  waiting: 'bg-danger shadow-[0_0_10px_1px_var(--color-danger)] live-loop',
  tooSoon: 'bg-danger shadow-[0_0_10px_1px_var(--color-danger)]',
  go: 'bg-ink',
  roundResult: 'bg-text-dim',
}

const PHASE_LABELS: Record<string, string> = {
  idle: 'standby',
  waiting: 'waiting',
  tooSoon: 'too soon',
  go: 'go',
  roundResult: 'round result',
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

  const onGo = phase === 'go'

  return (
    <div
      ref={boardRef}
      onClick={handleClick}
      className={`relative flex h-[65vh] min-h-96 max-h-[38rem] select-none flex-col items-center justify-center
        gap-4 overflow-hidden rounded-xl border border-border text-center transition-[background-color]
        duration-0 cursor-pointer ${PHASE_STYLES[phase]}`}
    >
      <div className="absolute top-5 left-5 flex items-center gap-2 sm:top-7 sm:left-7">
        <span className={`h-2 w-2 rounded-full transition-colors ${LED_STYLES[phase]}`} />
        <span
          className={`font-mono text-[0.6875rem] tracking-[0.14em] uppercase ${onGo ? 'text-ink/70' : 'text-text-dim'}`}
        >
          {PHASE_LABELS[phase]}
        </span>
      </div>

      {phase !== 'idle' && (
        <div
          className={`absolute top-5 right-5 font-mono text-sm tabular-nums sm:top-7 sm:right-7
            ${onGo ? 'text-ink/70' : 'text-text-dim'}`}
        >
          {String(round).padStart(2, '0')} / {String(totalRounds).padStart(2, '0')}
        </div>
      )}

      {phase === 'idle' && (
        <>
          <div className="mb-2 h-12 w-12 opacity-80">
            <ReactionPreview />
          </div>
          <p className="font-display text-2xl font-semibold lowercase tracking-tight text-text">reaction time</p>
          <p className="max-w-xs text-sm leading-relaxed text-text-muted">
            When the board turns green, click as fast as you can.
          </p>
          <p className="mt-2 font-mono text-xs tracking-[0.14em] text-text-dim uppercase">click to start</p>
        </>
      )}

      {phase === 'waiting' && <p className="font-display text-3xl font-semibold text-white sm:text-4xl">wait for green</p>}

      {phase === 'tooSoon' && (
        <>
          <p className="font-display text-3xl font-semibold text-white sm:text-4xl">too soon</p>
          <p className="text-sm text-white/60">click to try again</p>
        </>
      )}

      {phase === 'go' && <p className="font-display text-readout font-bold text-ink">click</p>}

      {phase === 'roundResult' && (
        <>
          <p className="font-display text-readout font-bold tabular-nums text-text">{lastMs}</p>
          <p className="-mt-2 font-mono text-xs tracking-[0.14em] text-text-dim uppercase">milliseconds</p>
          <p className="mt-3 text-sm text-text-muted">
            {round >= totalRounds ? 'click to see results' : `click to continue — round ${round + 1} of ${totalRounds}`}
          </p>
        </>
      )}
    </div>
  )
}
