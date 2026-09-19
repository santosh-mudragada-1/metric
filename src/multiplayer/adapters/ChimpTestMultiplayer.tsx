import { ChimpTestBoard } from '@/games/chimp-test/ChimpTestBoard'
import { WaitingForOthers } from '../WaitingForOthers'
import { useChimpTestMultiplayer } from './useChimpTestMultiplayer'

export function ChimpTestMultiplayer() {
  const { phase, positions, progress, revealed, wrongTileIndex, done, handleTileTap } = useChimpTestMultiplayer()

  if (done) return <WaitingForOthers />

  return (
    <ChimpTestBoard
      phase={phase}
      positions={positions}
      progress={progress}
      revealed={revealed}
      wrongTileIndex={wrongTileIndex}
      onStart={() => {}}
      onTileTap={handleTileTap}
    />
  )
}
