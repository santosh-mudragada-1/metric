import { useEffect, useRef } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router'
import { GAME_MAP, isGameId } from '@/games.config'
import type { GameId } from '@shared/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Countdown } from '@/games/shared/Countdown'
import { PartyProvider } from '@/multiplayer/PartyProvider'
import { usePartyRoom } from '@/multiplayer/usePartyRoom'
import { RoomLobby } from '@/multiplayer/RoomLobby'
import { RoomLeaderboard } from '@/multiplayer/RoomLeaderboard'
import { useProfile } from '@/hooks/useProfile'
import { ReactionTimeMultiplayer } from '@/multiplayer/adapters/ReactionTimeMultiplayer'
import { AimTrainerMultiplayer } from '@/multiplayer/adapters/AimTrainerMultiplayer'
import { SequenceMemoryMultiplayer } from '@/multiplayer/adapters/SequenceMemoryMultiplayer'
import { NumberMemoryMultiplayer } from '@/multiplayer/adapters/NumberMemoryMultiplayer'

function GameSwitch({ gameId }: { gameId: GameId }) {
  switch (gameId) {
    case 'reaction-time':
      return <ReactionTimeMultiplayer />
    case 'aim-trainer':
      return <AimTrainerMultiplayer />
    case 'sequence-memory':
      return <SequenceMemoryMultiplayer />
    case 'number-memory':
      return <NumberMemoryMultiplayer />
  }
}

function RoomContent({ roomCode }: { roomCode: string }) {
  const [searchParams] = useSearchParams()
  const { state, send, connected } = usePartyRoom()
  const { profile } = useProfile()
  const appliedInitialSettings = useRef(false)

  useEffect(() => {
    if (!state || appliedInitialSettings.current) return
    const me = state.players.find((p) => p.id === profile.clientPlayerId)
    if (!me?.isHost || state.phase !== 'lobby') return
    const gameParam = searchParams.get('game')
    const roundsParam = searchParams.get('rounds')
    if (gameParam && isGameId(gameParam) && gameParam !== state.gameId) {
      send({ type: 'hostChangeGame', gameId: gameParam })
    }
    const rounds = roundsParam ? Number(roundsParam) : null
    if (rounds && !Number.isNaN(rounds) && rounds !== state.maxRounds) {
      send({ type: 'hostSetRounds', maxRounds: rounds })
    }
    appliedInitialSettings.current = true
  }, [state, profile.clientPlayerId, searchParams, send])

  if (!connected || !state) {
    return <div className="flex h-96 items-center justify-center text-text-muted">Connecting to room...</div>
  }

  const me = state.players.find((p) => p.id === profile.clientPlayerId)
  const isHost = me?.isHost ?? false

  return (
    <div className="pt-6">
      <PageHeader
        title={`Room ${roomCode.toUpperCase()}`}
        subtitle={
          state.phase === 'lobby'
            ? `${GAME_MAP[state.gameId].name} · ${state.maxRounds} rounds`
            : `${GAME_MAP[state.gameId].name} · Round ${state.round}/${state.maxRounds}`
        }
      />

      {state.phase === 'lobby' && <RoomLobby />}

      {state.phase === 'countdown' && <Countdown endsAt={state.countdownEndsAt} onComplete={() => {}} />}

      {state.phase === 'playing' && <GameSwitch gameId={state.gameId} />}

      {state.phase === 'roundResult' && (
        <div className="flex flex-col items-center gap-4">
          <RoomLeaderboard leaderboard={state.leaderboard} title={`Standings after round ${state.round}`} />
          {isHost ? (
            <Button variant="primary" chevron onClick={() => send({ type: 'hostStartRound' })}>
              {state.round >= state.maxRounds ? 'See Final Results' : 'Next Round'}
            </Button>
          ) : (
            <p className="font-mono text-sm text-text-muted">waiting for host to continue...</p>
          )}
        </div>
      )}

      {state.phase === 'finished' && (
        <div className="flex flex-col items-center gap-4">
          <RoomLeaderboard leaderboard={state.leaderboard} title="Final Results" />
          {isHost && (
            <Button variant="primary" chevron onClick={() => send({ type: 'hostStartRound' })}>
              Play Again
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default function MultiplayerRoom() {
  const { roomCode } = useParams<{ roomCode: string }>()
  if (!roomCode) return <Navigate to="/party" replace />

  return (
    <PartyProvider roomCode={roomCode}>
      <RoomContent roomCode={roomCode} />
    </PartyProvider>
  )
}
