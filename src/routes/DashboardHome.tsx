import { useNavigate } from 'react-router'
import { UserGroupIcon } from '@heroicons/react/24/outline'
import { GAMES } from '@/games.config'
import { GameCard } from '@/components/layout/GameCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAnimation } from '@/hooks/useAnimation'
import { hoverIn, hoverOut } from '@/lib/animation/presets'

export default function DashboardHome() {
  const navigate = useNavigate()
  const { scope, run } = useAnimation<HTMLDivElement>()

  return (
    <div className="flex flex-col gap-8 pt-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          Test your reflexes
        </h1>
        <p className="mt-2 text-text-muted">Four quick games. Beat your best, or challenge your friends.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      <Card
        ref={scope}
        onMouseEnter={run(() => hoverIn(scope.current))}
        onMouseLeave={run(() => hoverOut(scope.current))}
        className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-chalk shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]">
            <UserGroupIcon className="h-6 w-6 text-ink" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-text">Play with friends</h2>
            <p className="text-sm text-text-muted">Create a room, share the code, and compete live.</p>
          </div>
        </div>
        <Button variant="primary" size="lg" chevron onClick={() => navigate('/party')}>
          Start a room
        </Button>
      </Card>
    </div>
  )
}
