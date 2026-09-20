import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { CHIMP_TEST } from '@shared/gameConfig'
import { Button } from '@/components/ui/Button'
import { pulseGlow } from '@/lib/animation/presets'
import { playFail, playLevelUp, playTile } from '@/lib/sound/sfx'
import { ChimpPreview } from '@/components/previews/ChimpPreview'
import { ChimpTile } from './ChimpTile'
import type { ChimpPhase } from './useChimpTestSolo'

const PHASE_LABELS: Record<string, string> = {
  wrongTile: 'not quite',
  levelUp: 'level up',
}

interface ChimpTestBoardProps {
  phase: ChimpPhase
  positions: number[]
  progress: number
  revealed: boolean
  wrongTileIndex: number | null
  onStart: () => void
  onTileTap: (cellIndex: number) => void
}

export function ChimpTestBoard({
  phase,
  positions,
  progress,
  revealed,
  wrongTileIndex,
  onStart,
  onTileTap,
}: ChimpTestBoardProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (progress > 0) playTile(progress - 1)
  }, [progress])

  useGSAP(() => {
    if (wrongTileIndex !== null) playFail()
  }, [wrongTileIndex])

  useGSAP(() => {
    if (phase === 'levelUp') {
      playLevelUp()
      pulseGlow(gridRef.current)
    }
  }, [phase])

  if (phase === 'idle') {
    return (
      <div className="relative flex h-[65vh] min-h-96 max-h-[38rem] flex-col items-center justify-center gap-4 overflow-hidden rounded-panel border border-border bg-surface p-6 text-center">
        <div className="absolute top-5 left-5 flex items-center gap-2 sm:top-7 sm:left-7">
          <span className="h-2 w-2 rounded-full bg-text-dim" />
          <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">standby</span>
        </div>
        <div className="mb-2 h-10 w-10 opacity-80">
          <ChimpPreview />
        </div>
        <p className="font-display text-2xl font-semibold lowercase tracking-tight text-text">chimp test</p>
        <p className="max-w-xs text-sm leading-relaxed text-text-muted">
          Memorize where the numbers sit, then tap them in order — they vanish the moment you start.
        </p>
        <Button onClick={onStart} chevron className="mt-2">
          Start
        </Button>
      </div>
    )
  }

  const inputLocked = phase !== 'input'
  const label = phase === 'input' ? (revealed ? 'memorize' : 'your turn') : PHASE_LABELS[phase]

  return (
    <div className="relative flex h-[65vh] min-h-96 max-h-[38rem] flex-col items-center justify-center gap-6 overflow-hidden rounded-panel border border-border bg-surface p-6">
      <div className="absolute top-5 left-5 flex items-center gap-2 sm:top-7 sm:left-7">
        <span
          className={`h-2 w-2 rounded-full ${phase === 'wrongTile' ? 'bg-danger' : 'bg-accent-chimp live-loop shadow-[0_0_10px_1px_var(--color-accent-chimp)]'}`}
        />
        <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">{label}</span>
      </div>
      <div className="absolute top-5 right-5 font-mono text-sm text-text-dim tabular-nums sm:top-7 sm:right-7">
        level {String(positions.length).padStart(2, '0')}
      </div>

      <p className="font-mono text-xs tracking-[0.14em] text-text-dim uppercase tabular-nums">
        {progress} / {positions.length}
      </p>

      <div ref={gridRef} className="grid w-full max-w-xl grid-cols-6 gap-2.5 sm:gap-3.5">
        {Array.from({ length: CHIMP_TEST.columns * CHIMP_TEST.rows }).map((_, i) => {
          const numberIndex = positions.indexOf(i)
          const isTarget = numberIndex !== -1
          const found = isTarget && numberIndex < progress
          const tileLabel = revealed && isTarget && !found ? numberIndex + 1 : undefined
          return (
            <ChimpTile
              key={i}
              label={tileLabel}
              found={found}
              wrong={wrongTileIndex === i}
              disabled={inputLocked}
              onTap={() => onTileTap(i)}
            />
          )
        })}
      </div>
    </div>
  )
}
