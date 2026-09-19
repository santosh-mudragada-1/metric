import { Navigate, useParams } from 'react-router'
import { GAME_MAP, isGameId } from '@/games.config'
import { PageHeader } from '@/components/layout/PageHeader'
import { ReactionTimeGame } from '@/games/reaction-time/ReactionTimeGame'
import { AimTrainerGame } from '@/games/aim-trainer/AimTrainerGame'
import { SequenceMemoryGame } from '@/games/sequence-memory/SequenceMemoryGame'
import { NumberMemoryGame } from '@/games/number-memory/NumberMemoryGame'
import { ChimpTestGame } from '@/games/chimp-test/ChimpTestGame'
import { VisualMemoryGame } from '@/games/visual-memory/VisualMemoryGame'
import { VerbalMemoryGame } from '@/games/verbal-memory/VerbalMemoryGame'
import { TypingGame } from '@/games/typing/TypingGame'

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
      {gameId === 'chimp-test' && <ChimpTestGame />}
      {gameId === 'visual-memory' && <VisualMemoryGame />}
      {gameId === 'verbal-memory' && <VerbalMemoryGame />}
      {gameId === 'typing' && <TypingGame />}
    </div>
  )
}
