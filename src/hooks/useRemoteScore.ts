import { useCallback } from 'react'
import { usePostHog } from '@posthog/react'
import type { GameId } from '@shared/types'
import { supabase } from '@/lib/supabase'
import { recordRun } from '@/lib/progress'
import { captureError, gameCompleted } from '@/lib/myAnalytics'

/** Optional `game_results` columns (see supabase/schema.sql). Other `extra` fields go to analytics only —
 *  sending a column the table doesn't have fails the whole insert. */
const EXTRA_RESULT_COLUMNS = new Set(['avg_hit_ms'])

/** Logs one completed run locally (history + play streak) and to Supabase for the signed-in player. */
export function useRemoteScore(gameId: GameId) {
  const posthog = usePostHog()
  const logResult = useCallback(
    async (metricValue: number, extra?: Record<string, number>) => {
      recordRun(gameId, metricValue)
      posthog?.capture('game_completed', {
        game_id: gameId,
        game: gameId,
        mode: 'practice',
        metric_value: metricValue,
        ...extra,
      })
      gameCompleted(gameId, 'practice', { metric_value: metricValue, ...extra })
      if (!supabase) return
      // Re-checks the session directly instead of trusting a `user` value captured in a closure —
      // that value can still be null right after a page load (the initial `getSession()` call
      // hasn't resolved yet) even though a real signed-in session exists, which would silently
      // drop the very first result of the visit.
      const { data, error: userError } = await supabase.auth.getUser()
      const user = data?.user
      if (userError || !user) return

      const columns = extra
        ? Object.fromEntries(Object.entries(extra).filter(([key]) => EXTRA_RESULT_COLUMNS.has(key)))
        : {}
      const { error } = await supabase
        .from('game_results')
        .insert({ user_id: user.id, game_id: gameId, metric_value: metricValue, ...columns })
      if (error && Object.keys(columns).length > 0) {
        // `extra` columns (e.g. avg_hit_ms) may not exist on this project's table yet — retry
        // with just the base columns so the run is still recorded rather than dropped entirely.
        const { error: retryError } = await supabase
          .from('game_results')
          .insert({ user_id: user.id, game_id: gameId, metric_value: metricValue })
        if (retryError) {
          console.error(`Failed to log ${gameId} result to Supabase:`, retryError)
          captureError(new Error(`Supabase save_score failed: ${retryError.message}`), { game: gameId })
        }
        return
      }
      if (error) {
        console.error(`Failed to log ${gameId} result to Supabase:`, error)
        captureError(new Error(`Supabase save_score failed: ${error.message}`), { game: gameId })
      }
    },
    [gameId, posthog],
  )

  return { logResult }
}
