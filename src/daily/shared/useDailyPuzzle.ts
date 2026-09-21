import { useMemo, useState } from 'react'
import { createDailyRng, todayKey, yesterdayKey } from '@/lib/dailySeed'
import {
  getDailyProgress,
  getDailyState,
  recordDailyCompletion,
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
  const dateKey = useMemo(() => todayKey(), [])

  const puzzle = useMemo(() => generate(createDailyRng(gameId)), [gameId, dateKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const [state, setStateRaw] = useState<State>(() => getDailyState(gameId, dateKey, initialState(puzzle)))
  const [progress, setProgress] = useState<DailyProgress>(() => getDailyProgress(gameId))
  const [justCompleted, setJustCompleted] = useState(false)

  const completedToday = progress.lastCompletedDate === dateKey

  const setState = (updater: State | ((prev: State) => State)) => {
    setStateRaw((prev) => {
      const next = typeof updater === 'function' ? (updater as (prev: State) => State)(prev) : updater
      setDailyState(gameId, dateKey, next)
      return next
    })
  }

  const complete = () => {
    if (completedToday) return
    const next = recordDailyCompletion(gameId, dateKey, yesterdayKey())
    setProgress(next)
    setJustCompleted(true)
    playSuccess()
  }

  return { puzzle, state, setState, progress, completedToday, justCompleted, complete }
}
