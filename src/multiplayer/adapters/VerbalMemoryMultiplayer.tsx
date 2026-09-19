import { VerbalMemoryBoard } from '@/games/verbal-memory/VerbalMemoryBoard'
import { WaitingForOthers } from '../WaitingForOthers'
import { useVerbalMemoryMultiplayer } from './useVerbalMemoryMultiplayer'

export function VerbalMemoryMultiplayer() {
  const { currentWord, score, lives, feedback, done, handleAnswer } = useVerbalMemoryMultiplayer()

  if (done) return <WaitingForOthers />

  return (
    <VerbalMemoryBoard
      phase="playing"
      currentWord={currentWord}
      score={score}
      lives={lives}
      feedback={feedback}
      onStart={() => {}}
      onAnswer={handleAnswer}
    />
  )
}
