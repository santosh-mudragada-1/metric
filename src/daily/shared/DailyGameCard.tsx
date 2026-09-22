import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ClockIcon } from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DailyComplete } from '@/daily/shared/DailyComplete'
import { formatDuration } from '@/daily/shared/formatDuration'
import { DAILY_GAME_MAP } from '@/dailyGames.config'
import { todayKey } from '@/lib/dailySeed'
import { playClick } from '@/lib/sound/sfx'
import { getOrStartDailyTimer, type DailyGameId, type DailyProgress } from '@/lib/storage'

interface DailyGameCardProps {
  gameId: DailyGameId
  completedToday: boolean
  progress: DailyProgress
  /** True when the saved state already differs from a fresh puzzle — skips the start card
   *  so returning mid-puzzle doesn't force you through the rules again. */
  hasProgress?: boolean
  children: ReactNode
}

/** The bordered panel every daily puzzle lives in — mirrors the Play page's game boards,
 *  which keep their pre-start instructions and live gameplay inside one shared container. */
export function DailyGameCard({ gameId, completedToday, progress, hasProgress = false, children }: DailyGameCardProps) {
  const [started, setStarted] = useState(hasProgress)
  const game = DAILY_GAME_MAP[gameId]
  const Preview = game.Preview
  const dateKey = useMemo(() => todayKey(), [])
  const [elapsedMs, setElapsedMs] = useState(0)

  // Start (or resume, after a mid-solve refresh) today's timer once the player actually begins.
  // The completion time itself is recorded synchronously in useDailyPuzzle's `complete()`, not
  // here — an effect here would run one render after DailyComplete already mounted and read
  // (and memoized) a stale, not-yet-recorded value.
  useEffect(() => {
    if (!started || completedToday) return
    const startedAt = getOrStartDailyTimer(gameId, dateKey)
    setElapsedMs(Date.now() - startedAt)
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt), 250)
    return () => clearInterval(id)
  }, [started, completedToday, gameId, dateKey])

  return (
    <Card className="p-6 sm:p-10">
      {completedToday ? (
        <DailyComplete gameId={gameId} progress={progress} />
      ) : started ? (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <span className="flex items-center gap-1.5 font-mono text-xs font-medium tabular-nums text-text-dim">
              <ClockIcon className="h-3.5 w-3.5" />
              {formatDuration(elapsedMs)}
            </span>
          </div>
          {children}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 py-6 text-center sm:py-10">
          <div className="h-12 w-12 opacity-90 sm:h-14 sm:w-14">
            <Preview />
          </div>
          <p className="font-display text-2xl font-semibold lowercase tracking-tight text-text">{game.name}</p>
          <p className="max-w-xs text-sm leading-relaxed text-text-muted">{game.howTo}</p>
          <Button
            variant="primary"
            size="lg"
            chevron
            onClick={() => {
              playClick()
              setStarted(true)
            }}
          >
            Start puzzle
          </Button>
        </div>
      )}
    </Card>
  )
}
