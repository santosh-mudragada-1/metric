import { useState, type ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DailyComplete } from '@/daily/shared/DailyComplete'
import { DAILY_GAME_MAP } from '@/dailyGames.config'
import { playClick } from '@/lib/sound/sfx'
import type { DailyGameId, DailyProgress } from '@/lib/storage'

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

  return (
    <Card className="p-6 sm:p-10">
      {completedToday ? (
        <DailyComplete gameId={gameId} progress={progress} />
      ) : started ? (
        children
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
