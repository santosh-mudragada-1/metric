import { CheckCircleIcon, StarIcon } from '@heroicons/react/24/solid'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CopyableCode } from '@/components/ui/CopyableCode'
import { AnimatedHeading } from '@/components/ui/AnimatedHeading'
import { GamePicker } from '@/multiplayer/GamePicker'
import { GAME_MAP } from '@/games.config'
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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card className="flex flex-col gap-5 p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs tracking-[0.14em] text-text-dim uppercase">
            Room <span className="text-text">{state.code.toUpperCase()}</span>
          </h2>
          <CopyableCode value={state.code} displayValue={state.code.toUpperCase()} />
        </div>

        <div className="flex flex-col divide-y divide-border border-y border-border">
          {state.players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between gap-3 py-3 ${player.connected ? '' : 'opacity-40'}`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${player.ready ? 'bg-success' : 'bg-text-dim'}`} />
                {player.isHost && <StarIcon className="h-3.5 w-3.5 shrink-0 text-accent-number" />}
                <span className="truncate font-display text-base font-medium text-text">{player.name}</span>
                {player.id === profile.clientPlayerId && <span className="shrink-0 text-xs text-text-dim">(you)</span>}
              </div>
              {player.ready ? (
                <CheckCircleIcon className="h-4 w-4 shrink-0 text-success" />
              ) : (
                <span className="shrink-0 font-mono text-[0.6875rem] tracking-[0.1em] text-text-dim uppercase">
                  not ready
                </span>
              )}
            </div>
          ))}
        </div>

        <Button
          variant={me?.ready ? 'ghost' : 'primary'}
          onClick={() => send({ type: 'setReady', ready: !me?.ready })}
        >
          {me?.ready ? 'Not ready' : "I'm ready"}
        </Button>
      </Card>

      <Card className="flex flex-col gap-5 p-6 sm:p-7">
        <AnimatedHeading
          as="h2"
          text="game settings"
          className="font-display text-lg font-semibold lowercase tracking-tight text-text"
          radius={100}
        />

        {isHost ? (
          <>
            <div>
              <label className="mb-2 block font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">
                Game
              </label>
              <GamePicker value={state.gameId} onChange={(gameId) => send({ type: 'hostChangeGame', gameId })} />
            </div>
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <label className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">Rounds</label>
                <span className="font-mono text-sm tabular-nums text-text">{String(state.maxRounds).padStart(2, '0')}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={state.maxRounds}
                onChange={(e) => send({ type: 'hostSetRounds', maxRounds: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <label className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">
                  Timer per round
                </label>
                <span className="font-mono text-sm tabular-nums text-text">{state.roundTimeLimitMs / 1000}s</span>
              </div>
              <input
                type="range"
                min={15}
                max={180}
                step={5}
                value={state.roundTimeLimitMs / 1000}
                onChange={(e) => send({ type: 'hostSetRoundTimer', roundTimeLimitMs: Number(e.target.value) * 1000 })}
                className="w-full"
              />
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <label className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">
                  Player limit
                </label>
                <span className="font-mono text-sm tabular-nums text-text">{state.maxPlayers}</span>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                value={state.maxPlayers}
                onChange={(e) => send({ type: 'hostSetMaxPlayers', maxPlayers: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-border pt-4">
              <span>
                <span className="block font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">
                  Elimination mode
                </span>
                <span className="mt-0.5 block text-xs text-text-muted">Lowest scorer is cut each round</span>
              </span>
              <input
                type="checkbox"
                checked={state.eliminationMode}
                onChange={(e) => send({ type: 'hostSetElimination', eliminationMode: e.target.checked })}
                className="h-5 w-5 shrink-0 accent-invert"
              />
            </label>

            <Button
              variant="primary"
              chevron
              disabled={!allReady}
              onClick={() => send({ type: 'hostStartRound' })}
              className="mt-auto"
            >
              {allReady ? 'Start game' : 'Waiting for everyone to be ready'}
            </Button>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-text-muted">
            <p className="font-display text-2xl font-semibold lowercase tracking-tight text-text">{game.name}</p>
            <p className="font-mono text-xs tracking-[0.1em] text-text-dim uppercase">
              {state.maxRounds} rounds — waiting for the host to start
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
