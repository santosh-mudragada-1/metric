import { TrophyIcon } from '@heroicons/react/24/solid'
import { Card } from '@/components/ui/Card'
import { useProfile } from '@/hooks/useProfile'
import type { LeaderboardEntry } from '@shared/types'

const RANK_COLORS = ['text-accent-number', 'text-text-muted', 'text-accent-reaction']

export function RoomLeaderboard({ leaderboard, title }: { leaderboard: LeaderboardEntry[]; title?: string }) {
  const { profile } = useProfile()

  return (
    <Card className="flex w-full max-w-sm flex-col gap-3 p-5">
      {title && <h3 className="font-mono text-sm font-semibold text-text-muted">{title}</h3>}
      <div className="flex flex-col gap-2">
        {leaderboard.map((entry, i) => (
          <div
            key={entry.playerId}
            className={`flex items-center justify-between gap-4 rounded-2xl border px-3 py-2.5
              ${entry.playerId === profile.clientPlayerId ? 'border-chalk/40 bg-surface-hover' : 'border-border bg-surface-raised'}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className={`w-5 shrink-0 text-sm font-bold tabular-nums ${RANK_COLORS[i] ?? 'text-text-dim'}`}>
                {i === 0 ? <TrophyIcon className="h-4 w-4" /> : i + 1}
              </span>
              <span className="truncate text-sm text-text">{entry.name}</span>
            </div>
            <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-text">
              {entry.totalScore} pts
            </span>
          </div>
        ))}
        {leaderboard.length === 0 && <p className="py-2 text-center text-sm text-text-dim">No results yet</p>}
      </div>
    </Card>
  )
}
