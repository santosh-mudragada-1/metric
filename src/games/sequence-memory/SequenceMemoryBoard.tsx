import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { SEQUENCE_MEMORY } from '@shared/gameConfig'
import { Button } from '@/components/ui/Button'
import { pulseGlow } from '@/lib/animation/presets'
import { playLevelUp, playTile } from '@/lib/sound/sfx'
import { Tile } from './Tile'
import type { SequencePhase } from './useSequenceMemorySolo'

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
      <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-surface-raised p-6 text-center">
        <p className="font-display text-xl font-semibold lowercase tracking-tight text-text">Sequence Memory</p>
        <p className="max-w-xs text-sm text-text-muted">
          Watch the tiles light up, then repeat the pattern. It grows by one tile every round.
        </p>
        <Button onClick={onStart} chevron>
          Start
        </Button>
      </div>
    )
  }

  const inputLocked = phase !== 'input'

  return (
    <div className="flex h-96 flex-col items-center justify-center gap-4">
      <p className="font-mono text-sm font-medium text-text-muted">
        {phase === 'showing' && 'watch closely...'}
        {phase === 'input' && `your turn — ${userProgress}/${sequence.length}`}
        {phase === 'wrongTile' && 'not quite!'}
        {phase === 'levelUp' && 'level up!'}
      </p>
      <div ref={gridRef} className="grid w-72 grid-cols-3 gap-3">
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
