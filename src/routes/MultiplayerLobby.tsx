import { useState } from 'react'
import { useNavigate } from 'react-router'
import { customAlphabet } from 'nanoid'
import { PlusIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { GAMES } from '@/games.config'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { useProfile } from '@/hooks/useProfile'

const generateRoomCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 5)

export default function MultiplayerLobby() {
  const navigate = useNavigate()
  const { profile, updateName } = useProfile()
  const [name, setName] = useState(profile.name)
  const [selectedGame, setSelectedGame] = useState(GAMES[0].id)
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
    navigate(`/party/${code}?game=${selectedGame}&rounds=${rounds}`)
  }

  const joinRoom = () => {
    const trimmed = commitName()
    if (!trimmed || joinCode.trim().length === 0) return
    navigate(`/party/${joinCode.trim().toUpperCase()}`)
  }

  return (
    <div className="pt-6">
      <PageHeader title="Play with Friends" subtitle="Create a room or join one with a code." />

      <div className="mb-6">
        <label className="mb-1.5 block text-sm font-medium text-text-muted">Your name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          maxLength={16}
          placeholder="Enter a display name"
          className="w-full max-w-xs rounded-full border border-border-strong bg-surface-raised px-5 py-2.5
            text-text outline-none focus:border-chalk/60"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-2 text-text">
            <PlusIcon className="h-5 w-5" />
            <h2 className="font-display font-semibold tracking-tight">Create a room</h2>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-muted">Choose a game</label>
            <div className="grid grid-cols-2 gap-2">
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  className={`flex cursor-pointer items-center gap-2 rounded-2xl border p-2.5 text-left text-sm
                    ${selectedGame === game.id ? 'border-chalk/60 bg-surface-hover' : 'border-border bg-surface-raised hover:bg-surface-hover'}`}
                >
                  <Badge Icon={game.Icon} accent={game.accent} />
                  <span className="text-text">{game.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-muted">Rounds: {rounds}</label>
            <input
              type="range"
              min={1}
              max={10}
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              className="w-full accent-chalk"
            />
          </div>

          <Button variant="primary" chevron disabled={!canProceed} onClick={createRoom} className="mt-auto">
            Create Room
          </Button>
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-2 text-text">
            <ArrowRightIcon className="h-5 w-5" />
            <h2 className="font-display font-semibold tracking-tight">Join a room</h2>
          </div>
          <p className="text-sm text-text-muted">Enter the 5-character code a friend shared with you.</p>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={5}
            placeholder="XXXXX"
            className="w-full rounded-full border border-border-strong bg-surface-raised px-4 py-3 text-center
              font-mono text-2xl tracking-[0.3em] text-text outline-none focus:border-chalk/60"
          />
          <Button
            variant="ghost"
            chevron
            disabled={!canProceed || joinCode.trim().length === 0}
            onClick={joinRoom}
            className="mt-auto"
          >
            Join Room
          </Button>
        </Card>
      </div>
    </div>
  )
}
