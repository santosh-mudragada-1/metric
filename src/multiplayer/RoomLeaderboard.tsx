import { useProfile } from '@/hooks/useProfile'
import type { LeaderboardEntry } from '@shared/types'

interface RoomLeaderboardProps {
  leaderboard: LeaderboardEntry[]
  title?: string
  eliminatedIds?: Set<string>
}

export function RoomLeaderboard({ leaderboard, title, eliminatedIds }: RoomLeaderboardProps) {
  const { profile } = useProfile()

  return (
    <div className="w-full max-w-md">
      {title && (
        <h3 className="mb-4 font-mono text-xs tracking-[0.14em] text-text-dim uppercase">{title}</h3>
      )}
      <div className="flex flex-col divide-y divide-border border-y border-border">
        {leaderboard.map((entry, i) => {
          const isMe = entry.playerId === profile.clientPlayerId
          const isFirst = i === 0
          const isEliminated = eliminatedIds?.has(entry.playerId) ?? false
          return (
            <div
              key={entry.playerId}
              className={`flex items-center gap-4 py-3.5 ${isEliminated ? 'opacity-40' : isMe ? 'text-text' : 'text-text-muted'}`}
            >
              <span
                className={`w-7 shrink-0 font-mono text-lg font-semibold tabular-nums
                  ${isFirst ? 'text-signal' : 'text-text-dim'}`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={`min-w-0 flex-1 truncate font-display text-lg font-medium ${isMe ? 'text-text' : ''}`}>
                {entry.name}
                {isMe && <span className="ml-2 text-xs text-text-dim">(you)</span>}
              </span>
              {isEliminated && (
                <span className="shrink-0 font-mono text-[0.6875rem] tracking-[0.1em] text-danger uppercase">
                  eliminated
                </span>
              )}
              <span className="shrink-0 font-mono text-lg font-semibold tabular-nums text-text">
                {entry.totalScore}
                <span className="ml-1 text-xs font-normal text-text-dim">pts</span>
              </span>
            </div>
          )
        })}
        {leaderboard.length === 0 && <p className="py-6 text-center text-sm text-text-dim">No results yet</p>}
      </div>
    </div>
  )
}
