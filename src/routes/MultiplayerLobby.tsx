import { type ReactNode, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { usePostHog } from '@posthog/react'
import { ArrowRightCircleIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAnimation } from '@/hooks/useAnimation'
import { hoverIn, hoverOut, pressDown, pressUp, shakeError } from '@/lib/animation/presets'
import { playClick, playFail, playHover } from '@/lib/sound/sfx'
import { useProfile } from '@/hooks/useProfile'
import { generateRoomCode } from '@/lib/roomCode'
import { withViewTransition } from '@/lib/viewTransition'

type LobbyMode = 'choose' | 'join'

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
  onClick,
}: {
  title: string
  description: string
  glyph: ReactNode
  onClick: () => void
}) {
  const { scope, run } = useAnimation<HTMLButtonElement>()

  return (
    <button
      ref={scope}
      type="button"
      onPointerDown={run(() => pressDown(scope.current))}
      onPointerUp={run(() => pressUp(scope.current))}
      onPointerLeave={run(() => pressUp(scope.current))}
      onMouseEnter={run(() => {
        hoverIn(scope.current)
        playHover()
      })}
      onMouseLeave={run(() => hoverOut(scope.current))}
      onClick={onClick}
      className="flex min-h-56 cursor-pointer flex-col items-start justify-between gap-8 rounded-panel border
        border-border bg-surface p-7 text-left shadow-[var(--shadow-card)] transition-colors
        hover:border-border-strong hover:bg-surface-raised sm:min-h-64 sm:p-9"
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
  const posthog = usePostHog()
  const { profile, updateName } = useProfile()
  const [name, setName] = useState(profile.name)
  const [mode, setMode] = useState<LobbyMode>('choose')
  const [joinCode, setJoinCode] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const { scope: nameFieldScope, run: runNameFieldAnim } = useAnimation<HTMLDivElement>()

  const canProceed = name.trim().length > 0

  const commitName = () => {
    const trimmed = name.trim()
    if (trimmed) updateName(trimmed)
    return trimmed
  }

  const nudgeForName = () => {
    playFail()
    if (nameFieldScope.current) runNameFieldAnim(() => shakeError(nameFieldScope.current))()
    nameInputRef.current?.focus()
  }

  const createRoom = () => {
    const trimmed = commitName()
    if (!trimmed) {
      nudgeForName()
      return
    }
    posthog?.capture('multiplayer_room_created')
    playClick()
    const code = generateRoomCode()
    withViewTransition(() => navigate(`/party/${code}`))
  }

  const joinRoom = () => {
    const trimmed = commitName()
    if (!trimmed || joinCode.trim().length === 0) {
      if (!trimmed) nudgeForName()
      return
    }
    posthog?.capture('multiplayer_room_joined')
    playClick()
    withViewTransition(() => navigate(`/party/${joinCode.trim().toUpperCase()}`))
  }

  const headerCopy: Record<LobbyMode, { title: string; subtitle: string }> = {
    choose: { title: 'Play with friends', subtitle: 'Create a room, or join one with a code.' },
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
          <div ref={nameFieldScope} className="mb-10 max-w-xs">
            <label className="mb-2 block font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">
              Your name
            </label>
            <input
              ref={nameInputRef}
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
              description="Jump straight into a new room — pick the game and tune settings once you're in."
              glyph={<CreateGlyph />}
              onClick={createRoom}
            />
            <OptionCard
              title="join a room"
              description="Already have a 5-character code? Jump straight in."
              glyph={<JoinGlyph />}
              onClick={() => {
                if (!canProceed) {
                  nudgeForName()
                  return
                }
                playClick()
                setMode('join')
              }}
            />
          </div>
        </>
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
