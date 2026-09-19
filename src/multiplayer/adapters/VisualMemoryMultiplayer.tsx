import { VisualMemoryBoard } from '@/games/visual-memory/VisualMemoryBoard'
import { WaitingForOthers } from '../WaitingForOthers'
import { useVisualMemoryMultiplayer } from './useVisualMemoryMultiplayer'

export function VisualMemoryMultiplayer() {
  const { phase, targetTiles, foundTiles, wrongTileIndex, done, handleTileTap } = useVisualMemoryMultiplayer()

  if (done) return <WaitingForOthers />

  return (
    <VisualMemoryBoard
      phase={phase}
      targetTiles={targetTiles}
      foundTiles={foundTiles}
      wrongTileIndex={wrongTileIndex}
      onStart={() => {}}
      onTileTap={handleTileTap}
    />
  )
}
