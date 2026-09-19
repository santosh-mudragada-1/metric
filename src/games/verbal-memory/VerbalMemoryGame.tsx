import { Countdown } from '@/games/shared/Countdown'
import { ResultCard } from '@/games/shared/ResultCard'
import { VerbalMemoryBoard } from './VerbalMemoryBoard'
import { useVerbalMemorySolo } from './useVerbalMemorySolo'

export function VerbalMemoryGame() {
  const { phase, currentWord, score, lives, feedback, isNewBest, start, onCountdownDone, handleAnswer } =
    useVerbalMemorySolo()

  if (phase === 'countdown') return <Countdown onComplete={onCountdownDone} />

  if (phase === 'result') {
    return (
      <ResultCard
        gameId="verbal-memory"
        accent="verbal"
        primary={{ value: score, label: 'words remembered' }}
        isNewBest={isNewBest}
        onPlayAgain={start}
      />
    )
  }

  return (
    <VerbalMemoryBoard
      phase={phase}
      currentWord={currentWord}
      score={score}
      lives={lives}
      feedback={feedback}
      onStart={start}
      onAnswer={handleAnswer}
    />
  )
}
