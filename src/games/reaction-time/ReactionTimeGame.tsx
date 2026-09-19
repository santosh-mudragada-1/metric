import { Countdown } from '@/games/shared/Countdown'
import { ResultCard } from '@/games/shared/ResultCard'
import { useReactionTimeSolo } from './useReactionTimeSolo'
import { ReactionTimeBoard } from './ReactionTimeBoard'

export function ReactionTimeGame() {
  const { phase, round, totalRounds, lastMs, result, isNewBest, start, onCountdownDone, handleTap } =
    useReactionTimeSolo()

  if (phase === 'countdown') return <Countdown onComplete={onCountdownDone} />

  if (phase === 'result' && result) {
    return (
      <ResultCard
        gameId="reaction-time"
        accent="reaction"
        primary={{ value: result.averageMs, unit: 'ms', label: 'average reaction' }}
        isNewBest={isNewBest}
        onPlayAgain={start}
        stats={[
          { label: 'Best attempt', value: `${result.bestMs} ms` },
          { label: 'Rounds', value: result.attempts.length },
        ]}
      />
    )
  }

  return (
    <ReactionTimeBoard
      phase={phase}
      round={round}
      totalRounds={totalRounds}
      lastMs={lastMs}
      onStart={start}
      onTap={handleTap}
    />
  )
}
