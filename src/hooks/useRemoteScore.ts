import { useCallback } from 'react'
import type { GameId } from '@shared/types'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

/** Logs one completed run to Supabase for the signed-in player, for the stats page's avg/best. */
export function useRemoteScore(gameId: GameId) {
  const { user } = useAuth()

  const logResult = useCallback(
    (metricValue: number) => {
      if (!supabase || !user) return
      void supabase.from('game_results').insert({ user_id: user.id, game_id: gameId, metric_value: metricValue })
    },
    [gameId, user],
  )

  return { logResult }
}
