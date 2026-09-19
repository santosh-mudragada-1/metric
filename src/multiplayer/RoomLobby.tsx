import { CheckCircleIcon, StarIcon } from '@heroicons/react/24/solid'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CopyableCode } from '@/components/ui/CopyableCode'
import { GAMES, GAME_MAP } from '@/games.config'
import { useProfile } from '@/hooks/useProfile'
import { usePartyRoom } from './usePartyRoom'

export function RoomLobby() {
  const { state, send } = usePartyRoom()
  const { profile } = useProfile()
  if (!state) return null

  const me = state.players.find((p) => p.id === profile.clientPlayerId)
  const isHost = me?.isHost ?? false
  const connectedPlayers = state.players.filter((p) => p.connected)
  const allReady = connectedPlayers.length > 0 && connectedPlayers.every((p) => p.ready)
  const game = GAME_MAP[state.gameId]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold tracking-tight text-text">Room {state.code.toUpperCase()}</h2>
          <CopyableCode value={state.code} displayValue={state.code.toUpperCase()} />
        </div>

        <div className="flex flex-col gap-2">
          {state.players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between rounded-2xl border border-border px-3 py-2 ${
                player.connected ? 'bg-surface-raised' : 'bg-surface-raised/40 opacity-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {player.isHost && <StarIcon className="h-4 w-4 text-accent-number" />}
                <span className="text-sm text-text">{player.name}</span>
                {player.id === profile.clientPlayerId && <span className="text-xs text-text-dim">(you)</span>}
              </div>
              {player.ready ? (
                <CheckCircleIcon className="h-5 w-5 text-success" />
              ) : (
                <span className="text-xs text-text-dim">not ready</span>
              )}
            </div>
          ))}
        </div>

        <Button
          variant={me?.ready ? 'ghost' : 'primary'}
          onClick={() => send({ type: 'setReady', ready: !me?.ready })}
        >
          {me?.ready ? 'Not Ready' : "I'm Ready"}
        </Button>
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <h2 className="font-display font-semibold tracking-tight text-text">Game Settings</h2>

        {isHost ? (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-muted">Game</label>
              <div className="grid grid-cols-2 gap-2">
                {GAMES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => send({ type: 'hostChangeGame', gameId: g.id })}
                    className={`flex cursor-pointer items-center gap-2 rounded-2xl border p-2.5 text-left text-sm
                      ${state.gameId === g.id ? 'border-chalk/60 bg-surface-hover' : 'border-border bg-surface-raised hover:bg-surface-hover'}`}
                  >
                    <Badge Icon={g.Icon} accent={g.accent} />
                    <span className="text-text">{g.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-muted">Rounds: {state.maxRounds}</label>
              <input
                type="range"
                min={1}
                max={10}
                value={state.maxRounds}
                onChange={(e) => send({ type: 'hostSetRounds', maxRounds: Number(e.target.value) })}
                className="w-full accent-chalk"
              />
            </div>
            <Button
              variant="primary"
              chevron
              disabled={!allReady}
              onClick={() => send({ type: 'hostStartRound' })}
              className="mt-auto"
            >
              {allReady ? 'Start Game' : 'Waiting for everyone to be ready'}
            </Button>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-text-muted">
            <Badge Icon={game.Icon} accent={game.accent} size="lg" />
            <p className="mt-2 font-medium text-text">{game.name}</p>
            <p className="text-sm">{state.maxRounds} rounds — waiting for the host to start</p>
          </div>
        )}
      </Card>
    </div>
  )
}
