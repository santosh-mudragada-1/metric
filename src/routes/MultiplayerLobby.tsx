import { useState } from 'react'
import { useNavigate } from 'react-router'
import { customAlphabet } from 'nanoid'
import { GamePicker } from '@/multiplayer/GamePicker'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { useProfile } from '@/hooks/useProfile'
import { withViewTransition } from '@/lib/viewTransition'
import type { GameId } from '@shared/types'

const generateRoomCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 5)

export default function MultiplayerLobby() {
  const navigate = useNavigate()
  const { profile, updateName } = useProfile()
  const [name, setName] = useState(profile.name)
  const [selectedGame, setSelectedGame] = useState<GameId>('reaction-time')
  const [rounds, setRounds] = useState(5)
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
    withViewTransition(() => navigate(`/party/${code}?game=${selectedGame}&rounds=${rounds}`))
  }

  const joinRoom = () => {
    const trimmed = commitName()
    if (!trimmed || joinCode.trim().length === 0) return
    withViewTransition(() => navigate(`/party/${joinCode.trim().toUpperCase()}`))
  }

  return (
    <div className="pt-6">
      <PageHeader title="Play with friends" subtitle="Create a room, or join one with a code." />

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
          className="w-full rounded-lg border border-border-strong bg-surface-raised px-4 py-3
            text-text outline-none focus:border-chalk/60"
        />
      </div>

      <div className="grid grid-cols-1 gap-x-16 gap-y-12 sm:grid-cols-2">
        <div className="flex flex-col gap-5">
          <h2 className="font-display text-xl font-semibold lowercase tracking-tight text-text">create a room</h2>

          <div>
            <label className="mb-2 block font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">
              Choose a game
            </label>
            <GamePicker value={selectedGame} onChange={setSelectedGame} />
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">Rounds</label>
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

          <Button variant="primary" chevron disabled={!canProceed} onClick={createRoom} className="mt-2 w-full sm:w-auto">
            Create room
          </Button>
        </div>

        <div className="flex flex-col gap-5 border-t border-border pt-12 sm:border-t-0 sm:pt-0">
          <h2 className="font-display text-xl font-semibold lowercase tracking-tight text-text">join a room</h2>
          <p className="-mt-3 text-sm text-text-muted">Enter the 5-character code a friend shared with you.</p>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={5}
            placeholder="XXXXX"
            className="w-full rounded-lg border border-border-strong bg-surface-raised px-4 py-4 text-center
              font-mono text-2xl tracking-[0.3em] text-text outline-none focus:border-chalk/60"
          />
          <Button
            variant="ghost"
            chevron
            disabled={!canProceed || joinCode.trim().length === 0}
            onClick={joinRoom}
            className="mt-2 w-full sm:w-auto"
          >
            Join room
          </Button>
        </div>
      </div>
    </div>
  )
}
