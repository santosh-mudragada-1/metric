import { Countdown } from '@/games/shared/Countdown'
import { ResultCard } from '@/games/shared/ResultCard'
import { VisualMemoryBoard } from './VisualMemoryBoard'
import { useVisualMemorySolo } from './useVisualMemorySolo'

export function VisualMemoryGame() {
  const {
    phase,
    targetTiles,
    foundTiles,
    wrongTileIndex,
    levelReached,
    isNewBest,
    start,
    onCountdownDone,
    handleTileTap,
  } = useVisualMemorySolo()

  if (phase === 'countdown') return <Countdown onComplete={onCountdownDone} />

  if (phase === 'result') {
    return (
      <ResultCard
        gameId="visual-memory"
        accent="visual"
        primary={{ value: levelReached, label: 'tiles recalled' }}
        isNewBest={isNewBest}
        onPlayAgain={start}
      />
    )
  }

  return (
    <VisualMemoryBoard
      phase={phase}
      targetTiles={targetTiles}
      foundTiles={foundTiles}
      wrongTileIndex={wrongTileIndex}
      onStart={start}
      onTileTap={handleTileTap}
    />
  )
}
