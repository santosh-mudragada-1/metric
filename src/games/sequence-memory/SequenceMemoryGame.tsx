import { Countdown } from '@/games/shared/Countdown'
import { ResultCard } from '@/games/shared/ResultCard'
import { SequenceMemoryBoard } from './SequenceMemoryBoard'
import { useSequenceMemorySolo } from './useSequenceMemorySolo'

export function SequenceMemoryGame() {
  const {
    phase,
    sequence,
    userProgress,
    wrongTileIndex,
    levelReached,
    isNewBest,
    start,
    onCountdownDone,
    onShowComplete,
    handleTileTap,
  } = useSequenceMemorySolo()

  if (phase === 'countdown') return <Countdown onComplete={onCountdownDone} />

  if (phase === 'result') {
    return (
      <ResultCard
        accent="sequence"
        title={`Level ${levelReached}`}
        isNewBest={isNewBest}
        onPlayAgain={start}
        stats={[{ label: 'Level reached', value: levelReached }]}
      />
    )
  }

  return (
    <SequenceMemoryBoard
      phase={phase}
      sequence={sequence}
      userProgress={userProgress}
      wrongTileIndex={wrongTileIndex}
      onStart={start}
      onShowComplete={onShowComplete}
      onTileTap={handleTileTap}
    />
  )
}
