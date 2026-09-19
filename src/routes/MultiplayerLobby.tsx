import { type ReactNode, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRightCircleIcon, PlusIcon } from '@heroicons/react/24/outline'
import { GamePicker } from '@/multiplayer/GamePicker'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAnimation } from '@/hooks/useAnimation'
import { hoverIn, hoverOut, pressDown, pressUp } from '@/lib/animation/presets'
import { playClick, playHover } from '@/lib/sound/sfx'
import { useProfile } from '@/hooks/useProfile'
import { generateRoomCode } from '@/lib/roomCode'
import { withViewTransition } from '@/lib/viewTransition'
import type { GameId } from '@shared/types'

type LobbyMode = 'choose' | 'create' | 'join'

function CreateGlyph() {
  return (
    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-signal-dim sm:h-16 sm:w-16">
      <span
        className="live-loop absolute inset-0 rounded-full border border-signal/40"
        style={{ animation: 'reaction-pulse 2.4s ease-in-out infinite' }}
      />
      <PlusIcon className="h-6 w-6 text-signal sm:h-7 sm:w-7" />
    </div>
  )
}

function JoinGlyph() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-signal-dim sm:h-16 sm:w-16">
      <ArrowRightCircleIcon
        className="live-loop h-7 w-7 text-signal sm:h-8 sm:w-8"
        style={{ animation: 'join-arrow-slide 1.8s ease-in-out infinite' }}
      />
    </div>
  )
}

function OptionCard({
  title,
  description,
  glyph,
  disabled,
  onClick,
}: {
  title: string
  description: string
  glyph: ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  const { scope, run } = useAnimation<HTMLButtonElement>()

  return (
    <button
      ref={scope}
      type="button"
      disabled={disabled}
      onPointerDown={run(() => pressDown(scope.current))}
      onPointerUp={run(() => pressUp(scope.current))}
      onPointerLeave={run(() => pressUp(scope.current))}
      onMouseEnter={run(() => {
        hoverIn(scope.current)
        playHover()
      })}
      onMouseLeave={run(() => hoverOut(scope.current))}
      onClick={() => {
        playClick()
        onClick()
      }}
      className="flex min-h-56 cursor-pointer flex-col items-start justify-between gap-8 rounded-panel border
        border-border bg-surface p-7 text-left shadow-[var(--shadow-card)] transition-colors
        hover:border-border-strong hover:bg-surface-raised disabled:pointer-events-none disabled:cursor-default
        disabled:opacity-40 sm:min-h-64 sm:p-9"
    >
      {glyph}
      <div>
        <span className="font-display text-2xl font-semibold lowercase tracking-tight text-text sm:text-3xl">
          {title}
        </span>
        <p className="mt-2 max-w-[26ch] text-sm text-text-muted sm:text-base">{description}</p>
      </div>
    </button>
  )
}

export default function MultiplayerLobby() {
  const navigate = useNavigate()
  const { profile, updateName } = useProfile()
  const [name, setName] = useState(profile.name)
  const [mode, setMode] = useState<LobbyMode>('choose')
  const [selectedGame, setSelectedGame] = useState<GameId>('reaction-time')
  const [rounds, setRounds] = useState(5)
  const [timerSec, setTimerSec] = useState(90)
  const [maxPlayers, setMaxPlayers] = useState(8)
  const [eliminationMode, setEliminationMode] = useState(false)
  const [joinCode, setJoinCode] = useState('')

  const canProceed = name.trim().length > 0

  const commitName = () => {
    const trimmed = name.trim()
    if (trimmed) updateName(trimmed)
    return trimmed
  }

  const createRoom = () => {
    const trimmed = commitName()
    if (!trimmed) return
    const code = generateRoomCode()
    const params = new URLSearchParams({
      game: selectedGame,
      rounds: String(rounds),
      timer: String(timerSec),
      maxPlayers: String(maxPlayers),
      elimination: String(eliminationMode),
    })
    withViewTransition(() => navigate(`/party/${code}?${params.toString()}`))
  }

  const joinRoom = () => {
    const trimmed = commitName()
    if (!trimmed || joinCode.trim().length === 0) return
    withViewTransition(() => navigate(`/party/${joinCode.trim().toUpperCase()}`))
  }

  const headerCopy: Record<LobbyMode, { title: string; subtitle: string }> = {
    choose: { title: 'Play with friends', subtitle: 'Create a room, or join one with a code.' },
    create: { title: 'Create a room', subtitle: 'Choose a game and tune the room settings.' },
    join: { title: 'Join a room', subtitle: 'Enter the 5-character code a friend shared with you.' },
  }

  return (
    <div className="pt-6">
      <PageHeader
        title={headerCopy[mode].title}
        subtitle={headerCopy[mode].subtitle}
        onBack={mode === 'choose' ? undefined : () => setMode('choose')}
        backLabel={mode === 'choose' ? 'Back to dashboard' : 'Back'}
      />

      {mode === 'choose' && (
        <>
          <div className="mb-10 max-w-xs">
            <label className="mb-2 block font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">
              Your name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitName}
              maxLength={16}
              placeholder="Enter a display name"
              className="w-full rounded-full border border-border-strong bg-surface-raised px-4 py-3
                text-text outline-none focus:border-invert/60"
            />
          </div>

          <div className="grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
            <OptionCard
              title="create a room"
              description="Pick a game, rounds, timer, and player limit — then share a code."
              glyph={<CreateGlyph />}
              disabled={!canProceed}
              onClick={() => setMode('create')}
            />
            <OptionCard
              title="join a room"
              description="Already have a 5-character code? Jump straight in."
              glyph={<JoinGlyph />}
              disabled={!canProceed}
              onClick={() => setMode('join')}
            />
          </div>
        </>
      )}

      {mode === 'create' && (
        <div className="grid max-w-4xl grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <label className="mb-2 block font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">
              Choose a game
            </label>
            <GamePicker value={selectedGame} onChange={setSelectedGame} />
          </div>

          <div className="flex flex-col gap-5">
            <Card className="flex h-fit flex-col gap-7 p-6 sm:p-7">
              <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">
                room settings
              </span>

              <div className="grid grid-cols-2 gap-x-6 gap-y-7">
                <div>
                  <div className="mb-2 flex items-baseline justify-between">
                    <label className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">
                      Rounds
                    </label>
                    <span className="font-mono text-sm tabular-nums text-text">{String(rounds).padStart(2, '0')}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={rounds}
                    onChange={(e) => setRounds(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-baseline justify-between">
                    <label className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">
                      Timer / round
                    </label>
                    <span className="font-mono text-sm tabular-nums text-text">{timerSec}s</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={180}
                    step={5}
                    value={timerSec}
                    onChange={(e) => setTimerSec(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-baseline justify-between">
                    <label className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">
                      Player limit
                    </label>
                    <span className="font-mono text-sm tabular-nums text-text">{maxPlayers}</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={12}
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="flex items-end justify-between gap-3 pb-1.5">
                  <span>
                    <span className="block font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">
                      Elimination
                    </span>
                    <span className="mt-0.5 block text-xs text-text-muted">Lowest scorer is cut each round</span>
                  </span>
                  <Switch checked={eliminationMode} onChange={setEliminationMode} label="Elimination mode" />
                </div>
              </div>
            </Card>

            <Button
              variant="primary"
              size="lg"
              chevron
              onClick={createRoom}
              className="w-full sm:w-auto sm:self-end"
            >
              Create room
            </Button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="flex max-w-xs flex-col gap-5">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={5}
            placeholder="XXXXX"
            className="w-full rounded-full border border-border-strong bg-surface-raised px-4 py-4 text-center
              font-mono text-2xl tracking-[0.3em] text-text outline-none focus:border-invert/60"
          />
          <Button
            variant="primary"
            size="lg"
            chevron
            disabled={joinCode.trim().length === 0}
            onClick={joinRoom}
            className="mt-2 w-full sm:w-auto"
          >
            Join room
          </Button>
        </div>
      )}
    </div>
  )
}
