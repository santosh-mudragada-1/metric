import { Countdown } from '@/games/shared/Countdown'
import { ResultCard } from '@/games/shared/ResultCard'
import { AimTrainerBoard } from './AimTrainerBoard'
import { useAimTrainerSolo } from './useAimTrainerSolo'

export function AimTrainerGame() {
  const {
    phase,
    target,
    hits,
    misses,
    bestStreak,
    accuracy,
    avgHitMs,
    totalTargets,
    streak,
    isNewBest,
    start,
    onCountdownDone,
    handleHit,
    handleMiss,
  } = useAimTrainerSolo()

  if (phase === 'countdown') return <Countdown onComplete={onCountdownDone} />

  if (phase === 'result') {
    return (
      <ResultCard
        gameId="aim-trainer"
        accent="aim"
        primary={{ value: accuracy, unit: '%', label: 'accuracy' }}
        isNewBest={isNewBest}
        onPlayAgain={start}
        stats={[
          { label: 'Hits', value: hits },
          { label: 'Misses', value: misses },
          { label: 'Avg hit time', value: `${avgHitMs} ms` },
          { label: 'Best streak', value: bestStreak },
        ]}
      />
    )
  }

  return (
    <AimTrainerBoard
      phase={phase}
      target={target}
      hits={hits}
      totalTargets={totalTargets}
      streak={streak}
      onStart={start}
      onHit={handleHit}
      onMiss={handleMiss}
    />
  )
}
