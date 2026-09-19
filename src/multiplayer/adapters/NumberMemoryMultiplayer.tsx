import { NumberMemoryBoard } from '@/games/number-memory/NumberMemoryBoard'
import { WaitingForOthers } from '../WaitingForOthers'
import { useNumberMemoryMultiplayer } from './useNumberMemoryMultiplayer'

export function NumberMemoryMultiplayer() {
  const { phase, digitCount, currentNumber, input, setInput, wasCorrect, done, submit } = useNumberMemoryMultiplayer()

  if (done) return <WaitingForOthers />

  return (
    <NumberMemoryBoard
      phase={phase}
      digitCount={digitCount}
      currentNumber={currentNumber}
      input={input}
      wasCorrect={wasCorrect}
      onStart={() => {}}
      onInputChange={setInput}
      onSubmit={submit}
    />
  )
}
