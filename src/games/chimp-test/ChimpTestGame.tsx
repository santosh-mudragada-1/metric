import { Countdown } from '@/games/shared/Countdown'
import { ResultCard } from '@/games/shared/ResultCard'
import { ChimpTestBoard } from './ChimpTestBoard'
import { useChimpTestSolo } from './useChimpTestSolo'

export function ChimpTestGame() {
  const {
    phase,
    positions,
    progress,
    revealed,
    wrongTileIndex,
    levelReached,
    isNewBest,
    start,
    onCountdownDone,
    handleTileTap,
  } = useChimpTestSolo()

  if (phase === 'countdown') return <Countdown onComplete={onCountdownDone} />

  if (phase === 'result') {
    return (
      <ResultCard
        gameId="chimp-test"
        accent="chimp"
        primary={{ value: levelReached, label: 'numbers reached' }}
        isNewBest={isNewBest}
        onPlayAgain={start}
      />
    )
  }

  return (
    <ChimpTestBoard
      phase={phase}
      positions={positions}
      progress={progress}
      revealed={revealed}
      wrongTileIndex={wrongTileIndex}
      onStart={start}
      onTileTap={handleTileTap}
    />
  )
}
