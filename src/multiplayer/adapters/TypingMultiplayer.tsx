import { TypingBoard } from '@/games/typing/TypingBoard'
import { WaitingForOthers } from '../WaitingForOthers'
import { useTypingMultiplayer } from './useTypingMultiplayer'

export function TypingMultiplayer() {
  const { text, typed, done, handleInputChange } = useTypingMultiplayer()

  if (done) return <WaitingForOthers />

  return <TypingBoard phase="typing" text={text} typed={typed} onStart={() => {}} onInputChange={handleInputChange} />
}
