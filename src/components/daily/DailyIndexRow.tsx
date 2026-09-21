import { useNavigate } from 'react-router'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { playClick } from '@/lib/sound/sfx'
import { withViewTransition } from '@/lib/viewTransition'
import { getDailyProgress, type DailyProgress } from '@/lib/storage'
import { todayKey } from '@/lib/dailySeed'
import { DailyGameIcon } from '@/components/daily/DailyGameIcon'
import type { DailyGameConfig } from '@/dailyGames.config'

function statusLabel(progress: DailyProgress, completedToday: boolean): string {
  if (completedToday) return progress.streak > 1 ? `Solved · ${progress.streak} day streak` : 'Solved today'
  if (progress.streak > 0) return `${progress.streak} day streak`
  return 'Play today’s puzzle'
}

export function DailyIndexRow({ game }: { game: DailyGameConfig }) {
  const navigate = useNavigate()
  const progress = getDailyProgress(game.id)
  const completedToday = progress.lastCompletedDate === todayKey()

  const go = () => {
    playClick()
    withViewTransition(() => navigate(`/daily/${game.id}`))
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => e.key === 'Enter' && go()}
      className="group grid cursor-pointer grid-cols-[3rem_1fr_auto] items-center gap-4 border-t border-border py-4
        outline-none transition-[transform,background-color] duration-200 last:border-b hover:translate-x-1
        active:translate-x-1 active:scale-[0.995] focus-visible:bg-surface-hover sm:py-5"
    >
      <DailyGameIcon gameId={game.id} className="h-12 w-12" />

      <div className="min-w-0">
        <h3 className="truncate font-display text-lg font-semibold tracking-tight text-text sm:text-xl">
          {game.name}
        </h3>
        <p className="mt-0.5 truncate text-sm text-text-muted">{game.blurb}</p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`hidden font-mono text-xs tabular-nums whitespace-nowrap sm:inline-flex sm:items-center sm:gap-1.5
            ${completedToday ? 'text-success' : 'text-text-dim'}`}
        >
          {completedToday && <CheckCircleIcon className="h-3.5 w-3.5" />}
          {statusLabel(progress, completedToday)}
        </span>
        <ChevronRightIcon className="h-4 w-4 text-text-dim transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-text" />
      </div>
    </div>
  )
}
