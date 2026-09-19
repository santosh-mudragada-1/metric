import { useNavigate } from 'react-router'
import { ChevronRightIcon } from '@heroicons/react/24/solid'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAnimation } from '@/hooks/useAnimation'
import { hoverIn, hoverOut, pressDown, pressUp } from '@/lib/animation/presets'
import { playClick } from '@/lib/sound/sfx'
import { useLocalBest } from '@/hooks/useLocalBest'
import type { GameConfig } from '@/games.config'

function formatBest(game: GameConfig, best: ReturnType<typeof useLocalBest>['best']): string | null {
  if (!best) return null
  switch (game.id) {
    case 'reaction-time':
      return `${'bestMs' in best ? best.bestMs : ''}ms`
    case 'aim-trainer':
      return `${'bestHits' in best ? best.bestHits : ''} hits`
    case 'sequence-memory':
      return `lv.${'bestLevel' in best ? best.bestLevel : ''}`
    case 'number-memory':
      return `${'bestDigits' in best ? best.bestDigits : ''} digits`
    default:
      return null
  }
}

export function GameCard({ game }: { game: GameConfig }) {
  const navigate = useNavigate()
  const { scope, run } = useAnimation<HTMLDivElement>()
  const { best } = useLocalBest(game.id)
  const bestLabel = formatBest(game, best)

  const go = () => {
    playClick()
    navigate(`/play/${game.id}`)
  }

  return (
    <Card
      ref={scope}
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => e.key === 'Enter' && go()}
      onPointerDown={run(() => pressDown(scope.current))}
      onPointerUp={run(() => pressUp(scope.current))}
      onPointerLeave={run(() => {
        pressUp(scope.current)
        hoverOut(scope.current)
      })}
      onMouseEnter={run(() => hoverIn(scope.current))}
      onMouseLeave={run(() => hoverOut(scope.current))}
      className="flex cursor-pointer flex-col gap-5 p-6 outline-none focus-visible:ring-2 focus-visible:ring-chalk/60"
    >
      <div className="flex items-start justify-between">
        <Badge Icon={game.Icon} accent={game.accent} size="lg" />
        {bestLabel && (
          <span className="rounded-full bg-surface-hover px-2.5 py-1 font-mono text-xs font-medium tabular-nums text-text-muted">
            {bestLabel}
          </span>
        )}
      </div>
      <div>
        <h3 className="lowercase font-display text-2xl font-semibold tracking-tight text-text">{game.name}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{game.blurb}</p>
      </div>
      <span className="mt-auto inline-flex w-fit items-center gap-1 rounded-full border border-border-strong px-4 py-2 text-sm font-medium text-text">
        Play
        <ChevronRightIcon className="h-3.5 w-3.5" />
      </span>
    </Card>
  )
}
