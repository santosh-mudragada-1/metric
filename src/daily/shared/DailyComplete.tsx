import { useNavigate } from 'react-router'
import { TrophyIcon } from '@heroicons/react/24/solid'
import { ArrowUpOnSquareIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { playBack, playClick, playCopy } from '@/lib/sound/sfx'
import { withViewTransition } from '@/lib/viewTransition'
import { DAILY_ACCENT_CLASSES, DAILY_GAMES, DAILY_GAME_MAP } from '@/dailyGames.config'
import { getDailyProgress, type DailyGameId, type DailyProgress } from '@/lib/storage'
import { todayKey } from '@/lib/dailySeed'

function pickUnplayedGame(currentId: DailyGameId) {
  const today = todayKey()
  const candidates = DAILY_GAMES.filter(
    (g) => g.id !== currentId && getDailyProgress(g.id).lastCompletedDate !== today,
  )
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null
}

export function DailyComplete({ gameId, progress }: { gameId: DailyGameId; progress: DailyProgress }) {
  const navigate = useNavigate()
  const game = DAILY_GAME_MAP[gameId]
  const classes = DAILY_ACCENT_CLASSES[game.accent]
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle')
  const nextGame = pickUnplayedGame(gameId)

  const share = async () => {
    const url = `${window.location.origin}/daily/${gameId}`
    const text = `I solved today's ${game.name} on Metric.`
    let shared = false
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Metric', text, url })
        shared = true
      } catch {
        // share sheet dismissed — fall back to clipboard
      }
    }
    if (!shared) {
      try {
        await navigator.clipboard.writeText(url)
      } catch {
        // clipboard unavailable — nothing more to do
      }
    }
    playCopy()
    setShareState('copied')
    setTimeout(() => setShareState('idle'), 1800)
  }

  return (
    <div className="flex flex-col items-center gap-8 py-10 text-center sm:py-14">
      <div
        className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-xs font-semibold
          tracking-wide uppercase ${classes.bgDim} ${classes.text}`}
      >
        <TrophyIcon className="h-3.5 w-3.5" />
        solved
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="font-mono text-xs font-medium tracking-[0.2em] text-text-dim uppercase">Streak</span>
        <div className={`font-display text-readout font-bold tabular-nums ${classes.text}`}>{progress.streak}</div>
        <p className="text-sm text-text-muted">{progress.streak === 1 ? 'day' : 'consecutive days'}</p>
      </div>

      <div className="flex w-full max-w-sm flex-col items-center gap-3">
        {nextGame ? (
          <Button
            variant="primary"
            size="lg"
            chevron
            onClick={() => {
              playClick()
              withViewTransition(() => navigate(`/daily/${nextGame.id}`))
            }}
            className="w-full"
          >
            Play {nextGame.name} next
          </Button>
        ) : (
          <div
            className={`flex h-13 w-full items-center justify-center gap-1.5 rounded-full border border-border-strong
              px-4 font-display text-base font-medium ${classes.text}`}
          >
            <CheckIcon className="h-4 w-4 shrink-0" />
            <span>All five solved today — see you tomorrow</span>
          </div>
        )}

        <Button variant="ghost" size="lg" disabled={shareState === 'copied'} onClick={share} className="w-full">
          {shareState === 'copied' ? (
            <>
              <CheckIcon className="h-4 w-4 shrink-0 text-success" />
              <span>Link copied</span>
            </>
          ) : (
            <>
              <ArrowUpOnSquareIcon className="h-4 w-4 shrink-0" />
              <span>Share result</span>
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={() => {
            playBack()
            navigate('/daily')
          }}
          className="w-full"
        >
          Back to Daily
        </Button>
      </div>
    </div>
  )
}
