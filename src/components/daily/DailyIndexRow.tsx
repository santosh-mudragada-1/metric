import { useNavigate } from 'react-router'
import { ArrowUpRightIcon } from '@heroicons/react/24/outline'
import { playClick } from '@/lib/sound/sfx'
import { withViewTransition } from '@/lib/viewTransition'
import { getDailyProgress, type DailyProgress } from '@/lib/storage'
import { todayKey } from '@/lib/dailySeed'
import { DailyGameIcon } from '@/components/daily/DailyGameIcon'
import { AnimatedHeading } from '@/components/ui/AnimatedHeading'
import type { DailyGameConfig } from '@/dailyGames.config'

const ACCENT_TEXT: Record<DailyGameConfig['accent'], string> = {
  zip: 'group-hover:text-accent-zip',
  tango: 'group-hover:text-accent-tango',
  queens: 'group-hover:text-accent-queens',
  patches: 'group-hover:text-accent-patches',
  hardword: 'group-hover:text-accent-hardword',
}

function statusLabel(progress: DailyProgress, completedToday: boolean): string {
  if (completedToday) return progress.streak > 1 ? `Solved · ${progress.streak} day streak` : 'Solved today'
  if (progress.streak > 0) return `${progress.streak} day streak`
  return 'Play today’s puzzle'
}

export function DailyIndexRow({ game, index }: { game: DailyGameConfig; index: number }) {
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
        <DailyGameIcon gameId={game.id} className="h-11 w-11" />
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span
          className={`font-mono text-xs tabular-nums whitespace-nowrap sm:text-sm ${
            completedToday ? 'text-success' : 'text-text-dim'
          }`}
        >
          {statusLabel(progress, completedToday)}
        </span>
        <ArrowUpRightIcon className="h-4 w-4 text-text-dim transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-text sm:h-5 sm:w-5" />
      </div>
    </div>
  )
}
