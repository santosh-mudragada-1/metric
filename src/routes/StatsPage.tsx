import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatTile } from '@/components/ui/StatTile'
import { Button } from '@/components/ui/Button'
import { AuthModal } from '@/components/auth/AuthModal'
import { ACCENT_CLASSES, GAMES } from '@/games.config'
import { SCORE_METRICS } from '@/lib/scoreMetrics'
import { supabase } from '@/lib/supabase'
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

export default function StatsPage() {
  const { user, configured, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<StatsByGame>({})
  const [loading, setLoading] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)

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

  if (!authLoading && !user) {
    return (
      <div className="pt-6">
        <PageHeader title="Your stats" subtitle="Sign in to track your average and best score across every test." />
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
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    )
  }

  return (
    <div className="pt-6">
      <PageHeader title="Your stats" subtitle="Average and best score for every test, since you signed in." />
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
      </div>
      {loading && <p className="mt-4 text-sm text-text-dim">Loading…</p>}
    </div>
  )
}
