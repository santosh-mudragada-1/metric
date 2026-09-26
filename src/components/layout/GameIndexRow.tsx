import { useNavigate } from 'react-router'
import { usePostHog } from '@posthog/react'
import { ArrowUpRightIcon } from '@heroicons/react/24/outline'
import { playClick } from '@/lib/sound/sfx'
import { useLocalBest } from '@/hooks/useLocalBest'
import { withViewTransition } from '@/lib/viewTransition'
import { AnimatedHeading } from '@/components/ui/AnimatedHeading'
import type { GameConfig } from '@/games.config'
import type { Bests } from '@/lib/storage'

const ACCENT_TEXT: Record<GameConfig['accent'], string> = {
  reaction: 'group-hover:text-accent-reaction',
  aim: 'group-hover:text-accent-aim',
  sequence: 'group-hover:text-accent-sequence',
  number: 'group-hover:text-accent-number',
  chimp: 'group-hover:text-accent-chimp',
  visual: 'group-hover:text-accent-visual',
  verbal: 'group-hover:text-accent-verbal',
  typing: 'group-hover:text-accent-typing',
}

export function formatBest(game: GameConfig, best: Bests[keyof Bests]): string | null {
  if (!best) return null
  switch (game.id) {
    case 'reaction-time':
      return 'bestMs' in best ? `${best.bestMs} ms best` : null
    case 'aim-trainer':
      return 'bestAvgHitMs' in best ? `${best.bestAccuracy}% · ${best.bestAvgHitMs}ms best` : null
    case 'sequence-memory':
      return 'bestLevel' in best ? `level ${best.bestLevel} best` : null
    case 'number-memory':
      return 'bestDigits' in best ? `${best.bestDigits} digits best` : null
    case 'chimp-test':
      return 'bestLevel' in best ? `level ${best.bestLevel} best` : null
    case 'visual-memory':
      return 'bestLevel' in best ? `level ${best.bestLevel} best` : null
    case 'verbal-memory':
      return 'bestScore' in best ? `${best.bestScore} score best` : null
    case 'typing':
      return 'bestWpm' in best ? `${best.bestWpm} wpm best` : null
    default:
      return null
  }
}

export function GameIndexRow({ game, index }: { game: GameConfig; index: number }) {
  const navigate = useNavigate()
  const posthog = usePostHog()
  const { best } = useLocalBest(game.id)
  const bestLabel = formatBest(game, best)
  const Preview = game.Preview

  const go = () => {
    posthog?.capture('game_selected', {
      game_id: game.id,
      selection_source: 'dashboard_list',
    })
    playClick()
    withViewTransition(() => navigate(`/play/${game.id}`))
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => e.key === 'Enter' && go()}
      className="group grid cursor-pointer grid-cols-[2.25rem_1fr_auto] items-center gap-4 border-t border-border
        py-5 outline-none transition-[transform,background-color] duration-200 last:border-b hover:translate-x-1
        active:translate-x-1 active:scale-[0.995] focus-visible:bg-surface-hover sm:grid-cols-[3.25rem_1fr_auto_auto]
        sm:gap-6 sm:py-8"
    >
      <span className="font-mono text-sm tabular-nums text-text-dim transition-colors group-hover:text-text-muted sm:text-base">
        {String(index).padStart(2, '0')}
      </span>

      <div className="min-w-0">
        <AnimatedHeading
          as="h3"
          text={game.name}
          className={`truncate font-display text-3xl font-semibold lowercase tracking-tight text-text transition-colors duration-200 sm:text-6xl sm:leading-[1.2] ${ACCENT_TEXT[game.accent]}`}
          radius={190}
        />
        <p className="mt-1 truncate text-sm text-text-muted sm:text-base">{game.blurb}</p>
      </div>

      <div className="hidden h-11 w-11 shrink-0 items-center justify-center opacity-60 transition-opacity duration-200 group-hover:opacity-100 sm:flex">
        <Preview />
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {bestLabel && (
          <span className="font-mono text-xs tabular-nums whitespace-nowrap text-text-dim sm:text-sm">{bestLabel}</span>
        )}
        <ArrowUpRightIcon className="h-4 w-4 text-text-dim transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-text sm:h-5 sm:w-5" />
      </div>
    </div>
  )
}
