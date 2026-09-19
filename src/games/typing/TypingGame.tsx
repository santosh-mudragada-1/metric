import { Countdown } from '@/games/shared/Countdown'
import { ResultCard } from '@/games/shared/ResultCard'
import { TypingBoard } from './TypingBoard'
import { useTypingSolo } from './useTypingSolo'

export function TypingGame() {
  const { phase, text, typed, wpm, accuracy, isNewBest, start, onCountdownDone, handleInputChange } = useTypingSolo()

  if (phase === 'countdown') return <Countdown onComplete={onCountdownDone} />

  if (phase === 'result') {
    return (
      <ResultCard
        gameId="typing"
        accent="typing"
        primary={{ value: wpm, unit: 'wpm', label: 'typing speed' }}
        isNewBest={isNewBest}
        onPlayAgain={start}
        stats={[{ label: 'Accuracy', value: `${accuracy}%` }]}
      />
    )
  }

  return <TypingBoard phase={phase} text={text} typed={typed} onStart={start} onInputChange={handleInputChange} />
}
