import type { GameId } from '@shared/types'
import {
  getBests,
  getStatsMigrated,
  setStatsMigrated,
  type AimTrainerBest,
  type Bests,
  type ChimpTestBest,
  type NumberMemoryBest,
  type ReactionTimeBest,
  type SequenceMemoryBest,
  type TypingBest,
  type VerbalMemoryBest,
  type VisualMemoryBest,
} from '@/lib/storage'
import { supabase } from '@/lib/supabase'

/** Mirrors the metric each game logs to Supabase during a real signed-in run — see the `useRemoteScore` call sites. */
function metricValueFor(gameId: GameId, best: NonNullable<Bests[GameId]>): number {
  switch (gameId) {
    case 'reaction-time':
      return (best as ReactionTimeBest).bestMs
    case 'aim-trainer':
      return (best as AimTrainerBest).bestAccuracy
    case 'sequence-memory':
      return (best as SequenceMemoryBest).bestLevel
    case 'number-memory':
      return (best as NumberMemoryBest).bestDigits
    case 'chimp-test':
      return (best as ChimpTestBest).bestLevel
    case 'visual-memory':
      return (best as VisualMemoryBest).bestLevel
    case 'verbal-memory':
      return (best as VerbalMemoryBest).bestScore
    case 'typing':
      return (best as TypingBest).bestWpm
  }
}

/**
 * Runs from played as a guest live only in localStorage (as a single "best"), so signing in
 * afterwards would otherwise leave the stats page empty even though the home page still shows
 * those bests. Backfills one row per game the guest has a local best for, so the stats page
 * picks them up too. Runs once per browser (not once per account) — see `getStatsMigrated`.
 */
export async function migrateLocalBestsIfNeeded(userId: string): Promise<void> {
  if (!supabase || getStatsMigrated()) return

  const bests = getBests()
  const rows = (Object.entries(bests) as [GameId, Bests[GameId]][])
    .filter((entry): entry is [GameId, NonNullable<Bests[GameId]>] => Boolean(entry[1]))
    .map(([gameId, best]) => ({
      user_id: userId,
      game_id: gameId,
      metric_value: metricValueFor(gameId, best),
      ...(gameId === 'aim-trainer' ? { avg_hit_ms: (best as AimTrainerBest).bestAvgHitMs } : {}),
    }))

  if (rows.length === 0) {
    setStatsMigrated()
    return
  }

  const { error } = await supabase.from('game_results').insert(rows)
  if (!error) {
    setStatsMigrated()
  } else {
    console.error('Failed to migrate local bests to Supabase:', error)
  }
}
