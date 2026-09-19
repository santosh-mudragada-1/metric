import { Navigate, useParams } from 'react-router'
import { GAME_MAP, isGameId } from '@/games.config'
import { PageHeader } from '@/components/layout/PageHeader'
import { ReactionTimeGame } from '@/games/reaction-time/ReactionTimeGame'
import { AimTrainerGame } from '@/games/aim-trainer/AimTrainerGame'
import { SequenceMemoryGame } from '@/games/sequence-memory/SequenceMemoryGame'
import { NumberMemoryGame } from '@/games/number-memory/NumberMemoryGame'

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>()

  if (!gameId || !isGameId(gameId)) return <Navigate to="/" replace />

  const game = GAME_MAP[gameId]

  return (
    <div className="pt-6">
      <PageHeader title={game.name} subtitle={game.blurb} />
      {gameId === 'reaction-time' && <ReactionTimeGame />}
      {gameId === 'aim-trainer' && <AimTrainerGame />}
      {gameId === 'sequence-memory' && <SequenceMemoryGame />}
      {gameId === 'number-memory' && <NumberMemoryGame />}
    </div>
  )
}
