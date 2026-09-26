import { Navigate, useParams } from 'react-router'
import type { GameId } from '@shared/types'
import { GAME_MAP, isGameId } from '@/games.config'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatBest } from '@/components/layout/GameIndexRow'
import { useLocalBest } from '@/hooks/useLocalBest'
import { ReactionTimeGame } from '@/games/reaction-time/ReactionTimeGame'
import { AimTrainerGame } from '@/games/aim-trainer/AimTrainerGame'
import { SequenceMemoryGame } from '@/games/sequence-memory/SequenceMemoryGame'
import { NumberMemoryGame } from '@/games/number-memory/NumberMemoryGame'
import { ChimpTestGame } from '@/games/chimp-test/ChimpTestGame'
import { VisualMemoryGame } from '@/games/visual-memory/VisualMemoryGame'
import { VerbalMemoryGame } from '@/games/verbal-memory/VerbalMemoryGame'
import { TypingGame } from '@/games/typing/TypingGame'

/** The number to chase — sits in the header for the whole run. */
function BestReadout({ gameId }: { gameId: GameId }) {
  const { best } = useLocalBest(gameId)
  const label = formatBest(GAME_MAP[gameId], best)
  if (!label) return null
  return (
    <div className="mt-3 hidden shrink-0 flex-col items-end gap-1 text-right sm:flex">
      <span className="font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-text-dim uppercase">
        personal best
      </span>
      <span className="font-mono text-sm font-semibold tabular-nums text-text">{label.replace(/ best$/, '')}</span>
    </div>
  )
}

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>()

  if (!gameId || !isGameId(gameId)) return <Navigate to="/" replace />

  const game = GAME_MAP[gameId]

  return (
    <div className="pt-6">
      <PageHeader title={game.name} subtitle={game.blurb} action={<BestReadout key={gameId} gameId={gameId} />} />
      {gameId === 'reaction-time' && <ReactionTimeGame />}
      {gameId === 'aim-trainer' && <AimTrainerGame />}
      {gameId === 'sequence-memory' && <SequenceMemoryGame />}
      {gameId === 'number-memory' && <NumberMemoryGame />}
      {gameId === 'chimp-test' && <ChimpTestGame />}
      {gameId === 'visual-memory' && <VisualMemoryGame />}
      {gameId === 'verbal-memory' && <VerbalMemoryGame />}
      {gameId === 'typing' && <TypingGame />}
    </div>
  )
}
