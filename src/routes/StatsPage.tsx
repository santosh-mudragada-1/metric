import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatTile } from '@/components/ui/StatTile'
import { Button } from '@/components/ui/Button'
import { AuthModal } from '@/components/auth/AuthModal'
import { formatDuration } from '@/daily/shared/formatDuration'
import { ACCENT_CLASSES, GAMES } from '@/games.config'
import { DAILY_ACCENT_CLASSES, DAILY_GAMES } from '@/dailyGames.config'
import { todayKey } from '@/lib/dailySeed'
import { SCORE_METRICS } from '@/lib/scoreMetrics'
import { supabase } from '@/lib/supabase'
import { getDailyProgress, getDailyTimeStats, type DailyGameId } from '@/lib/storage'
import { useAuth } from '@/hooks/useAuth'
import type { GameId } from '@shared/types'

interface GameStat {
  count: number
  best: number
  average: number
}

type StatsByGame = Partial<Record<GameId, GameStat>>

function formatStat(gameId: GameId, value: number): string {
  const metric = SCORE_METRICS[gameId]
  return metric.unit ? `${metric.format(value)} ${metric.unit}` : metric.format(value)
}

/** Daily puzzle stats live entirely in localStorage (there's no account tie-in), so — unlike the
 *  reflex-test tab above — this reads directly at render time instead of waiting on auth/Supabase. */
function DailyGamesStats() {
  const dateKey = useMemo(() => todayKey(), [])

  return (
    <div className="flex flex-col">
      {DAILY_GAMES.map((game) => {
        const progress = getDailyProgress(game.id as DailyGameId)
        const timeStats = getDailyTimeStats(game.id as DailyGameId, dateKey)
        const classes = DAILY_ACCENT_CLASSES[game.accent]
        const solvedToday = progress.lastCompletedDate === dateKey

        return (
          <div
            key={game.id}
            className="grid grid-cols-1 gap-4 border-t border-border py-6 last:border-b sm:grid-cols-[1fr_auto_auto_auto]
              sm:items-center sm:gap-8"
          >
            <div>
              <h3 className={`font-display text-xl font-semibold tracking-tight lowercase ${classes.text}`}>
                {game.name}
              </h3>
              <p className="mt-0.5 text-sm text-text-muted">
                {timeStats.count > 0
                  ? `${timeStats.count} day${timeStats.count === 1 ? '' : 's'} solved`
                  : 'Not solved yet'}
              </p>
            </div>
            <StatTile label="Streak" value={progress.streak > 0 ? progress.streak : '—'} />
            <StatTile label="Today" value={solvedToday && timeStats.todayMs !== null ? formatDuration(timeStats.todayMs) : '—'} />
            <StatTile label="Average" value={timeStats.avgMs !== null ? formatDuration(timeStats.avgMs) : '—'} />
          </div>
        )
      })}
    </div>
  )
}

type StatsTab = 'reflex' | 'daily'

export default function StatsPage() {
  const { user, configured, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<StatsByGame>({})
  const [loading, setLoading] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)
  const [tab, setTab] = useState<StatsTab>('reflex')

  useEffect(() => {
    if (!user || !supabase) {
      setStats({})
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    supabase
      .from('game_results')
      .select('game_id, metric_value')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) {
          setStats({})
          setLoading(false)
          return
        }
        const grouped: Partial<Record<GameId, number[]>> = {}
        for (const row of data as { game_id: GameId; metric_value: number }[]) {
          const list = grouped[row.game_id] ?? (grouped[row.game_id] = [])
          list.push(Number(row.metric_value))
        }
        const next: StatsByGame = {}
        for (const [gameId, values] of Object.entries(grouped) as [GameId, number[]][]) {
          const metric = SCORE_METRICS[gameId]
          const best = metric.direction === 'lower-better' ? Math.min(...values) : Math.max(...values)
          const average = values.reduce((a, b) => a + b, 0) / values.length
          next[gameId] = { count: values.length, best, average }
        }
        setStats(next)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const tabButton = (id: StatsTab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`rounded-full px-4 py-2 font-mono text-xs font-semibold tracking-[0.1em] uppercase transition-colors
        ${tab === id ? 'bg-invert text-on-invert' : 'text-text-muted hover:text-text'}`}
    >
      {label}
    </button>
  )

  const showSignInGate = tab === 'reflex' && !authLoading && !user

  return (
    <div className="pt-6">
      <PageHeader
        title="Your stats"
        subtitle={
          tab === 'reflex'
            ? 'Average and best score for every test, since you signed in.'
            : "Streaks and solve times for every daily puzzle — tracked on this device, no sign-in needed."
        }
      />
      <div className="mb-6 flex items-center gap-1 rounded-full border border-border-strong p-1" style={{ width: 'fit-content' }}>
        {tabButton('reflex', 'Reflex tests')}
        {tabButton('daily', 'Daily games')}
      </div>

      {showSignInGate ? (
        <div className="flex flex-col items-start gap-4 border-t border-border py-10">
          <Button variant="primary" size="lg" onClick={() => setAuthOpen(true)}>
            Sign in to view stats
          </Button>
          {!configured && (
            <p className="text-sm text-text-dim">
              Sign-in isn't configured yet — add Supabase credentials to enable this.
            </p>
          )}
        </div>
      ) : tab === 'daily' ? (
        <DailyGamesStats />
      ) : (
        <div className="flex flex-col">
          {GAMES.map((game) => {
            const stat = stats[game.id]
            const classes = ACCENT_CLASSES[game.accent]
            return (
              <div
                key={game.id}
                className="grid grid-cols-1 gap-4 border-t border-border py-6 last:border-b sm:grid-cols-[1fr_auto_auto]
                  sm:items-center sm:gap-8"
              >
                <div>
                  <h3 className={`font-display text-xl font-semibold tracking-tight lowercase ${classes.text}`}>
                    {game.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-text-muted">
                    {stat ? `${stat.count} run${stat.count === 1 ? '' : 's'} played` : 'No runs yet'}
                  </p>
                </div>
                <StatTile label="Best" value={stat ? formatStat(game.id, stat.best) : '—'} accent={game.accent} />
                <StatTile label="Average" value={stat ? formatStat(game.id, stat.average) : '—'} accent={game.accent} />
              </div>
            )
          })}
          {loading && <p className="mt-4 text-sm text-text-dim">Loading…</p>}
        </div>
      )}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
