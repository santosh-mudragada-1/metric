import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { SEQUENCE_MEMORY } from '@shared/gameConfig'
import { Button } from '@/components/ui/Button'
import { pulseGlow } from '@/lib/animation/presets'
import { playLevelUp, playTile } from '@/lib/sound/sfx'
import { SequencePreview } from '@/components/previews/SequencePreview'
import { Tile } from './Tile'
import type { SequencePhase } from './useSequenceMemorySolo'

const PHASE_LABELS: Record<string, string> = {
  showing: 'watch closely',
  input: 'your turn',
  wrongTile: 'not quite',
  levelUp: 'level up',
}

interface SequenceMemoryBoardProps {
  phase: SequencePhase
  sequence: number[]
  userProgress: number
  wrongTileIndex: number | null
  onStart: () => void
  onShowComplete: () => void
  onTileTap: (index: number) => void
}

export function SequenceMemoryBoard({
  phase,
  sequence,
  userProgress,
  wrongTileIndex,
  onStart,
  onShowComplete,
  onTileTap,
}: SequenceMemoryBoardProps) {
  const [activeTile, setActiveTile] = useState<number | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const onShowCompleteRef = useRef(onShowComplete)
  onShowCompleteRef.current = onShowComplete

  useGSAP(() => {
    if (phase !== 'showing' || sequence.length === 0) return
    const flashOn = SEQUENCE_MEMORY.flashOnMs / 1000
    const flashGap = SEQUENCE_MEMORY.flashGapMs / 1000
    const tl = gsap.timeline({ onComplete: () => onShowCompleteRef.current() })
    sequence.forEach((tileIndex) => {
      tl.call(() => {
        setActiveTile(tileIndex)
        playTile(tileIndex)
      })
        .to({}, { duration: flashOn })
        .call(() => setActiveTile(null))
        .to({}, { duration: flashGap })
    })
    tl.to({}, { duration: SEQUENCE_MEMORY.betweenRoundsMs / 1000 })
    return () => {
      tl.kill()
      setActiveTile(null)
    }
  }, [phase, sequence])

  useGSAP(() => {
    if (phase === 'levelUp') {
      playLevelUp()
      pulseGlow(gridRef.current)
    }
  }, [phase])

  if (phase === 'idle') {
    return (
      <div className="relative flex h-[65vh] min-h-96 max-h-[38rem] flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border border-border bg-surface p-6 text-center">
        <div className="absolute top-5 left-5 flex items-center gap-2 sm:top-7 sm:left-7">
          <span className="h-2 w-2 rounded-full bg-text-dim" />
          <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">standby</span>
        </div>
        <div className="mb-2 h-10 w-10 opacity-80">
          <SequencePreview />
        </div>
        <p className="font-display text-2xl font-semibold lowercase tracking-tight text-text">sequence memory</p>
        <p className="max-w-xs text-sm leading-relaxed text-text-muted">
          Watch the tiles light up, then repeat the pattern. It grows by one tile every round.
        </p>
        <Button onClick={onStart} chevron className="mt-2">
          Start
        </Button>
      </div>
    )
  }

  const inputLocked = phase !== 'input'

  return (
    <div className="relative flex h-[65vh] min-h-96 max-h-[38rem] flex-col items-center justify-center gap-8 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="absolute top-5 left-5 flex items-center gap-2 sm:top-7 sm:left-7">
        <span
          className={`h-2 w-2 rounded-full ${phase === 'wrongTile' ? 'bg-danger' : 'bg-accent-sequence live-loop shadow-[0_0_10px_1px_var(--color-accent-sequence)]'}`}
        />
        <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">{PHASE_LABELS[phase]}</span>
      </div>
      <div className="absolute top-5 right-5 font-mono text-sm text-text-dim tabular-nums sm:top-7 sm:right-7">
        level {String(sequence.length).padStart(2, '0')}
      </div>

      {phase === 'input' && (
        <p className="font-mono text-xs tracking-[0.14em] text-text-dim uppercase tabular-nums">
          {userProgress} / {sequence.length}
        </p>
      )}

      <div ref={gridRef} className="grid w-72 grid-cols-3 gap-3 sm:w-96 sm:gap-4">
        {Array.from({ length: SEQUENCE_MEMORY.gridSize }).map((_, i) => (
          <Tile
            key={i}
            active={activeTile === i}
            wrong={wrongTileIndex === i}
            disabled={inputLocked}
            onTap={() => onTileTap(i)}
          />
        ))}
      </div>
    </div>
  )
}
