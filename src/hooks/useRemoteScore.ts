import { useCallback } from 'react'
import type { GameId } from '@shared/types'
import { supabase } from '@/lib/supabase'

/** Logs one completed run to Supabase for the signed-in player, for the stats page's avg/best. */
export function useRemoteScore(gameId: GameId) {
  const logResult = useCallback(
    async (metricValue: number) => {
      if (!supabase) return
      // Re-checks the session directly instead of trusting a `user` value captured in a closure —
      // that value can still be null right after a page load (the initial `getSession()` call
      // hasn't resolved yet) even though a real signed-in session exists, which would silently
      // drop the very first result of the visit.
      const { data, error: userError } = await supabase.auth.getUser()
      const user = data?.user
      if (userError || !user) return

      const { error } = await supabase.from('game_results').insert({ user_id: user.id, game_id: gameId, metric_value: metricValue })
      if (error) console.error(`Failed to log ${gameId} result to Supabase:`, error)
    },
    [gameId],
  )

  return { logResult }
}
