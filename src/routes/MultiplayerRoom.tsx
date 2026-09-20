import { useEffect, useRef } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router'
import { GAME_MAP, isGameId } from '@/games.config'
import type { GameId } from '@shared/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Countdown } from '@/games/shared/Countdown'
import { PartyProvider } from '@/multiplayer/PartyProvider'
import { usePartyRoom } from '@/multiplayer/usePartyRoom'
import { RoomLobby, RoomLobbyAction } from '@/multiplayer/RoomLobby'
import { RoomLeaderboard } from '@/multiplayer/RoomLeaderboard'
import { useProfile } from '@/hooks/useProfile'
import { ReactionTimeMultiplayer } from '@/multiplayer/adapters/ReactionTimeMultiplayer'
import { AimTrainerMultiplayer } from '@/multiplayer/adapters/AimTrainerMultiplayer'
import { SequenceMemoryMultiplayer } from '@/multiplayer/adapters/SequenceMemoryMultiplayer'
import { NumberMemoryMultiplayer } from '@/multiplayer/adapters/NumberMemoryMultiplayer'
import { ChimpTestMultiplayer } from '@/multiplayer/adapters/ChimpTestMultiplayer'
import { VisualMemoryMultiplayer } from '@/multiplayer/adapters/VisualMemoryMultiplayer'
import { VerbalMemoryMultiplayer } from '@/multiplayer/adapters/VerbalMemoryMultiplayer'
import { TypingMultiplayer } from '@/multiplayer/adapters/TypingMultiplayer'

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
    case 'chimp-test':
      return <ChimpTestMultiplayer />
    case 'visual-memory':
      return <VisualMemoryMultiplayer />
    case 'verbal-memory':
      return <VerbalMemoryMultiplayer />
    case 'typing':
      return <TypingMultiplayer />
  }
}

function RoomContent({ roomCode }: { roomCode: string }) {
  const [searchParams] = useSearchParams()
  const { state, send, connected, error } = usePartyRoom()
  const { profile } = useProfile()
  const appliedInitialSettings = useRef(false)

  useEffect(() => {
    if (!state || appliedInitialSettings.current) return
    const me = state.players.find((p) => p.id === profile.clientPlayerId)
    if (!me?.isHost || state.phase !== 'lobby') return
    const gameParam = searchParams.get('game')
    const roundsParam = searchParams.get('rounds')
    const timerParam = searchParams.get('timer')
    const maxPlayersParam = searchParams.get('maxPlayers')
    const eliminationParam = searchParams.get('elimination')
    if (gameParam && isGameId(gameParam) && gameParam !== state.gameId) {
      send({ type: 'hostChangeGame', gameId: gameParam })
    }
    const rounds = roundsParam ? Number(roundsParam) : null
    if (rounds && !Number.isNaN(rounds) && rounds !== state.maxRounds) {
      send({ type: 'hostSetRounds', maxRounds: rounds })
    }
    const roundTimeLimitMs = timerParam ? Number(timerParam) * 1000 : null
    if (roundTimeLimitMs && !Number.isNaN(roundTimeLimitMs) && roundTimeLimitMs !== state.roundTimeLimitMs) {
      send({ type: 'hostSetRoundTimer', roundTimeLimitMs })
    }
    const maxPlayers = maxPlayersParam ? Number(maxPlayersParam) : null
    if (maxPlayers && !Number.isNaN(maxPlayers) && maxPlayers !== state.maxPlayers) {
      send({ type: 'hostSetMaxPlayers', maxPlayers })
    }
    if (eliminationParam !== null) {
      const eliminationMode = eliminationParam === 'true'
      if (eliminationMode !== state.eliminationMode) {
        send({ type: 'hostSetElimination', eliminationMode })
      }
    }
    appliedInitialSettings.current = true
  }, [state, profile.clientPlayerId, searchParams, send])

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-2 text-center">
        <p className="font-display text-xl font-semibold lowercase tracking-tight text-text">{error}</p>
        <p className="font-mono text-xs tracking-[0.1em] text-text-dim uppercase">try a different room code</p>
      </div>
    )
  }

  if (!connected || !state) {
    return (
      <div className="flex h-96 items-center justify-center font-mono text-sm tracking-[0.1em] text-text-dim uppercase">
        connecting to room...
      </div>
    )
  }

  const me = state.players.find((p) => p.id === profile.clientPlayerId)
  const isHost = me?.isHost ?? false
  const eliminatedIds = new Set(state.players.filter((p) => p.eliminated).map((p) => p.id))

  return (
    <div className="pt-6">
      <PageHeader
        title={`Room ${roomCode.toUpperCase()}`}
        subtitle={
          state.phase === 'lobby'
            ? `${GAME_MAP[state.gameId].name} · ${state.maxRounds} rounds`
            : `${GAME_MAP[state.gameId].name} · Round ${state.round}/${state.maxRounds}`
        }
        action={state.phase === 'lobby' ? <RoomLobbyAction /> : undefined}
      />

      {state.phase === 'lobby' && <RoomLobby />}

      {state.phase === 'countdown' && <Countdown endsAt={state.countdownEndsAt} onComplete={() => {}} />}

      {state.phase === 'playing' &&
        (me?.eliminated ? (
          <div className="relative flex h-[65vh] min-h-96 max-h-[38rem] flex-col items-center justify-center gap-3 overflow-hidden rounded-panel border border-border bg-surface text-center">
            <p className="font-display text-2xl font-semibold lowercase tracking-tight text-text">you're eliminated</p>
            <p className="max-w-xs text-sm text-text-muted">Watching the rest of the room play it out.</p>
          </div>
        ) : (
          <GameSwitch gameId={state.gameId} />
        ))}

      {state.phase === 'roundResult' && (
        <div className="flex flex-col items-center gap-8 py-6">
          <RoomLeaderboard
            leaderboard={state.leaderboard}
            title={`Standings after round ${state.round}`}
            eliminatedIds={eliminatedIds}
          />
          {isHost ? (
            <Button variant="primary" chevron onClick={() => send({ type: 'hostStartRound' })}>
              {state.round >= state.maxRounds ? 'See final results' : 'Next round'}
            </Button>
          ) : (
            <p className="font-mono text-xs tracking-[0.1em] text-text-dim uppercase">waiting for host to continue...</p>
          )}
        </div>
      )}

      {state.phase === 'finished' && (
        <div className="flex flex-col items-center gap-8 py-6">
          <RoomLeaderboard leaderboard={state.leaderboard} title="Final results" eliminatedIds={eliminatedIds} />
          {isHost && (
            <Button variant="primary" chevron onClick={() => send({ type: 'hostStartRound' })}>
              Play again
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
