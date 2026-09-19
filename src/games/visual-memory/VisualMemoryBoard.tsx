import { VISUAL_MEMORY } from '@shared/gameConfig'
import { Button } from '@/components/ui/Button'
import { VisualPreview } from '@/components/previews/VisualPreview'
import { VisualTile } from './VisualTile'
import type { VisualPhase } from './useVisualMemorySolo'

const PHASE_LABELS: Record<string, string> = {
  showing: 'memorize',
  input: 'your turn',
  wrongTile: 'not quite',
  levelUp: 'level up',
}

interface VisualMemoryBoardProps {
  phase: VisualPhase
  targetTiles: number[]
  foundTiles: number[]
  wrongTileIndex: number | null
  onStart: () => void
  onTileTap: (index: number) => void
}

export function VisualMemoryBoard({
  phase,
  targetTiles,
  foundTiles,
  wrongTileIndex,
  onStart,
  onTileTap,
}: VisualMemoryBoardProps) {
  if (phase === 'idle') {
    return (
      <div className="relative flex h-[65vh] min-h-96 max-h-[38rem] flex-col items-center justify-center gap-4 overflow-hidden rounded-panel border border-border bg-surface p-6 text-center">
        <div className="absolute top-5 left-5 flex items-center gap-2 sm:top-7 sm:left-7">
          <span className="h-2 w-2 rounded-full bg-text-dim" />
          <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">standby</span>
        </div>
        <div className="mb-2 h-10 w-10 opacity-80">
          <VisualPreview />
        </div>
        <p className="font-display text-2xl font-semibold lowercase tracking-tight text-text">visual memory</p>
        <p className="max-w-xs text-sm leading-relaxed text-text-muted">
          Memorize the lit tiles, then tap them back from memory. One more tile lights up every round.
        </p>
        <Button onClick={onStart} chevron className="mt-2">
          Start
        </Button>
      </div>
    )
  }

  const inputLocked = phase !== 'input'

  return (
    <div className="relative flex h-[65vh] min-h-96 max-h-[38rem] flex-col items-center justify-center gap-8 overflow-hidden rounded-panel border border-border bg-surface">
      <div className="absolute top-5 left-5 flex items-center gap-2 sm:top-7 sm:left-7">
        <span
          className={`h-2 w-2 rounded-full ${phase === 'wrongTile' ? 'bg-danger' : 'bg-accent-visual live-loop shadow-[0_0_10px_1px_var(--color-accent-visual)]'}`}
        />
        <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">{PHASE_LABELS[phase]}</span>
      </div>
      <div className="absolute top-5 right-5 font-mono text-sm text-text-dim tabular-nums sm:top-7 sm:right-7">
        level {String(targetTiles.length).padStart(2, '0')}
      </div>

      <p
        className={`font-mono text-xs tracking-[0.14em] text-text-dim uppercase tabular-nums ${phase === 'input' ? '' : 'invisible'}`}
      >
        {foundTiles.length} / {targetTiles.length}
      </p>

      <div className="grid w-72 grid-cols-5 gap-2.5 sm:w-96 sm:gap-3.5">
        {Array.from({ length: VISUAL_MEMORY.gridSize * VISUAL_MEMORY.gridSize }).map((_, i) => {
          const active = (phase === 'showing' && targetTiles.includes(i)) || foundTiles.includes(i)
          return (
            <VisualTile
              key={i}
              active={active}
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
