import { Countdown } from '@/games/shared/Countdown'
import { ResultCard } from '@/games/shared/ResultCard'
import { NumberMemoryBoard } from './NumberMemoryBoard'
import { useNumberMemorySolo } from './useNumberMemorySolo'

export function NumberMemoryGame() {
  const {
    phase,
    digitCount,
    currentNumber,
    input,
    setInput,
    digitsReached,
    wasCorrect,
    isNewBest,
    start,
    onCountdownDone,
    submit,
  } = useNumberMemorySolo()

  if (phase === 'countdown') return <Countdown onComplete={onCountdownDone} />

  if (phase === 'result') {
    return (
      <ResultCard
        accent="number"
        primary={{ value: digitsReached, label: 'digits recalled' }}
        isNewBest={isNewBest}
        onPlayAgain={start}
      />
    )
  }

  return (
    <NumberMemoryBoard
      phase={phase}
      digitCount={digitCount}
      currentNumber={currentNumber}
      input={input}
      wasCorrect={wasCorrect}
      onStart={start}
      onInputChange={setInput}
      onSubmit={submit}
    />
  )
}
