import { useEffect, useMemo, useRef, useState } from 'react'
import { usePostHog } from '@posthog/react'
import { createDailyRng, todayKey, yesterdayKey } from '@/lib/dailySeed'
import {
  getDailyProgress,
  getDailyState,
  getDailyTimerStart,
  recordDailyCompletion,
  recordDailyTime,
  setDailyState,
  type DailyGameId,
  type DailyProgress,
} from '@/lib/storage'
import { playSuccess } from '@/lib/sound/sfx'

/**
 * Generates today's puzzle once (seeded so every player sees the same board), restores any
 * in-progress state from localStorage, and tracks the win/streak bookkeeping shared by every
 * daily game.
 */
export function useDailyPuzzle<Puzzle, State>(
  gameId: DailyGameId,
  generate: (rng: () => number) => Puzzle,
  initialState: (puzzle: Puzzle) => State,
) {
  const posthog = usePostHog()
  const dateKey = useMemo(() => todayKey(), [])

  const puzzle = useMemo(() => generate(createDailyRng(gameId)), [gameId, dateKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const [state, setStateRaw] = useState<State>(() => getDailyState(gameId, dateKey, initialState(puzzle)))
  const [progress, setProgress] = useState<DailyProgress>(() => getDailyProgress(gameId))
  const [justCompleted, setJustCompleted] = useState(false)

  const completedToday = progress.lastCompletedDate === dateKey

  const startedRef = useRef(false)
  useEffect(() => {
    if (startedRef.current || completedToday) return
    startedRef.current = true
    posthog?.capture('daily_puzzle_started', { game_id: gameId })
    posthog?.capture('game_started', { game: gameId, mode: 'daily' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setState = (updater: State | ((prev: State) => State)) => {
    setStateRaw((prev) => {
      const next = typeof updater === 'function' ? (updater as (prev: State) => State)(prev) : updater
      setDailyState(gameId, dateKey, next)
      return next
    })
  }

  const complete = () => {
    if (completedToday) return
    // Recorded synchronously here — before `completedToday` flips and DailyComplete's own
    // (memoized) read of this same data mounts — rather than in an effect downstream, which
    // would run one render too late and see a stale, not-yet-written value.
    const startedAt = getDailyTimerStart(gameId, dateKey)
    const durationMs = startedAt !== null ? Date.now() - startedAt : null
    if (durationMs !== null) recordDailyTime(gameId, dateKey, durationMs)
    const prevStreak = progress.streak
    const next = recordDailyCompletion(gameId, dateKey, yesterdayKey())
    const completionTime = durationMs !== null ? Math.round(durationMs / 1000) : undefined

    posthog?.capture('daily_puzzle_completed', {
      game_id: gameId,
      duration_ms: durationMs,
      streak: next.streak,
    })
    posthog?.capture('game_completed', {
      game: gameId,
      mode: 'daily',
      completion_time: completionTime,
      streak: next.streak,
    })

    if (prevStreak === 0) {
      posthog?.capture('streak_started', { game: gameId, mode: 'daily', streak: next.streak })
    } else if (next.streak === 1) {
      posthog?.capture('streak_broken', { game: gameId, mode: 'daily', previous_streak: prevStreak })
    } else {
      posthog?.capture('streak_extended', { game: gameId, mode: 'daily', streak: next.streak })
    }

    setProgress(next)
    setJustCompleted(true)
    playSuccess()
  }

  return { puzzle, state, setState, progress, completedToday, justCompleted, complete }
}
