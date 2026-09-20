import { useEffect } from 'react'
import { CheckCircleIcon, StarIcon } from '@heroicons/react/24/solid'
import { ComputerDesktopIcon, DevicePhoneMobileIcon, DeviceTabletIcon, UserMinusIcon } from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CopyableCode } from '@/components/ui/CopyableCode'
import { AnimatedHeading } from '@/components/ui/AnimatedHeading'
import { GamePicker } from '@/multiplayer/GamePicker'
import { GAME_MAP } from '@/games.config'
import { useProfile } from '@/hooks/useProfile'
import { useAnimation } from '@/hooks/useAnimation'
import { shakeError } from '@/lib/animation/presets'
import { playClick, playFail } from '@/lib/sound/sfx'
import { DEVICE_SENSITIVE_GAMES, hasMixedDevices } from '@shared/gameConfig'
import type { DeviceType, Player } from '@shared/types'
import { usePartyRoom } from './usePartyRoom'

const DEVICE_ICONS: Record<DeviceType, typeof ComputerDesktopIcon> = {
  desktop: ComputerDesktopIcon,
  mobile: DevicePhoneMobileIcon,
  tablet: DeviceTabletIcon,
}

const DEVICE_LABELS: Record<DeviceType, string> = {
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet',
}

function DeviceIcon({ device }: { device: DeviceType }) {
  const Icon = DEVICE_ICONS[device]
  return <Icon className="h-3.5 w-3.5 shrink-0 text-text-dim" title={DEVICE_LABELS[device]} />
}

const LOCKED_GAME_REASON =
  'Disabled — players joined from different device types (touch vs. mouse/keyboard), which would give one side an unfair advantage.'

/** Rendered in the room header, beside the title — the host's start control, or their own ready toggle for everyone else. */
export function RoomLobbyAction() {
  const { state, send, nudgePlayers } = usePartyRoom()
  const { profile } = useProfile()
  if (!state) return null

  const me = state.players.find((p) => p.id === profile.clientPlayerId)
  const isHost = me?.isHost ?? false

  if (!isHost) {
    return (
      <Button
        variant={me?.ready ? 'ghost' : 'primary'}
        chevron
        onClick={() => send({ type: 'setReady', ready: !me?.ready })}
        className="shrink-0"
      >
        {me?.ready ? 'Not ready' : "I'm ready"}
      </Button>
    )
  }

  const notReadyIds = state.players.filter((p) => p.connected && !p.isHost && !p.ready).map((p) => p.id)
  const allReady = notReadyIds.length === 0
  const currentGameLocked = hasMixedDevices(state.players) && DEVICE_SENSITIVE_GAMES.includes(state.gameId)

  const onStart = () => {
    if (currentGameLocked) return
    if (!allReady) {
      playFail()
      nudgePlayers(notReadyIds)
      return
    }
    send({ type: 'hostStartRound' })
  }

  return (
    <Button variant="primary" chevron disabled={currentGameLocked} onClick={onStart} className="shrink-0">
      {currentGameLocked ? 'Pick a different game' : allReady ? 'Start game' : 'Waiting for everyone to be ready'}
    </Button>
  )
}

function PlayerRow({ player, isMe, canKick, onKick }: { player: Player; isMe: boolean; canKick: boolean; onKick: () => void }) {
  const { nudge } = usePartyRoom()
  const { scope, run } = useAnimation<HTMLDivElement>()

  useEffect(() => {
    if (nudge?.playerIds.includes(player.id)) run(() => shakeError(scope.current))()
  }, [nudge, player.id, run, scope])

  return (
    <div
      ref={scope}
      className={`flex items-center justify-between gap-3 py-3 ${player.connected ? '' : 'opacity-40'}`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${player.ready ? 'bg-success' : 'bg-text-dim'}`} />
        {player.isHost && <StarIcon className="h-3.5 w-3.5 shrink-0 text-accent-number" />}
        <DeviceIcon device={player.device} />
        <span className="truncate font-display text-base font-medium text-text">{player.name}</span>
        {isMe && <span className="shrink-0 text-xs text-text-dim">(you)</span>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {player.ready ? (
          <CheckCircleIcon className="h-4 w-4 shrink-0 text-success" />
        ) : (
          <span className="font-mono text-[0.6875rem] tracking-[0.1em] text-text-dim uppercase">not ready</span>
        )}
        {canKick && (
          <button
            type="button"
            title="Remove from room"
            onClick={onKick}
            className="cursor-pointer text-text-dim transition-colors hover:text-danger"
          >
            <UserMinusIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export function RoomLobby() {
  const { state, send } = usePartyRoom()
  const { profile } = useProfile()
  if (!state) return null

  const me = state.players.find((p) => p.id === profile.clientPlayerId)
  const isHost = me?.isHost ?? false
  const game = GAME_MAP[state.gameId]
  const mixedDevices = hasMixedDevices(state.players)
  const currentGameLocked = mixedDevices && DEVICE_SENSITIVE_GAMES.includes(state.gameId)

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
            <PlayerRow
              key={player.id}
              player={player}
              isMe={player.id === profile.clientPlayerId}
              canKick={isHost && !player.isHost}
              onKick={() => {
                playClick()
                send({ type: 'hostKickPlayer', playerId: player.id })
              }}
            />
          ))}
        </div>
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
              <GamePicker
                value={state.gameId}
                onChange={(gameId) => send({ type: 'hostChangeGame', gameId })}
                lockedGameIds={mixedDevices ? DEVICE_SENSITIVE_GAMES : undefined}
                lockedReason={LOCKED_GAME_REASON}
              />
              {mixedDevices && (
                <p className="mt-2 text-xs text-text-muted">
                  Reaction Time, Aim Trainer, and Typing are disabled — players joined from different device types
                  (mobile/tablet touch vs. desktop mouse and keyboard) would have an unfair advantage. They'll unlock
                  automatically once everyone's on the same type of device.
                </p>
              )}
              {currentGameLocked && (
                <p className="mt-2 text-xs text-signal">
                  {game.name} just became unfair for this room's mix of devices — pick another game before starting.
                </p>
              )}
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
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-text-muted">
            <p className="font-display text-2xl font-semibold lowercase tracking-tight text-text">{game.name}</p>
            <p className="font-mono text-xs tracking-[0.1em] text-text-dim uppercase">{state.maxRounds} rounds</p>
          </div>
        )}
      </Card>
    </div>
  )
}
