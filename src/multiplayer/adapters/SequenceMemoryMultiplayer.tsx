import { SequenceMemoryBoard } from '@/games/sequence-memory/SequenceMemoryBoard'
import { WaitingForOthers } from '../WaitingForOthers'
import { useSequenceMemoryMultiplayer } from './useSequenceMemoryMultiplayer'

export function SequenceMemoryMultiplayer() {
  const { phase, sequence, userProgress, wrongTileIndex, done, onShowComplete, onTileTap } =
    useSequenceMemoryMultiplayer()

  if (done) return <WaitingForOthers />

  return (
    <SequenceMemoryBoard
      phase={phase}
      sequence={sequence}
      userProgress={userProgress}
      wrongTileIndex={wrongTileIndex}
      onStart={() => {}}
      onShowComplete={onShowComplete}
      onTileTap={onTileTap}
    />
  )
}
