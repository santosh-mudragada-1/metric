import { ReactionTimeBoard } from '@/games/reaction-time/ReactionTimeBoard'
import { WaitingForOthers } from '../WaitingForOthers'
import { useReactionTimeMultiplayer } from './useReactionTimeMultiplayer'

export function ReactionTimeMultiplayer() {
  const { phase, round, totalRounds, lastMs, done, onTap } = useReactionTimeMultiplayer()

  if (done) return <WaitingForOthers />

  return (
    <ReactionTimeBoard
      phase={phase}
      round={round}
      totalRounds={totalRounds}
      lastMs={lastMs}
      onStart={() => {}}
      onTap={onTap}
    />
  )
}
