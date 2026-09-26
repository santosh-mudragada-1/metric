import { useCallback, useEffect, useState } from 'react'
import { BESTS_CHANGED_EVENT, getBests, setBest, type Bests } from '@/lib/storage'

export function useLocalBest<K extends keyof Bests>(gameId: K) {
  const [best, setBestState] = useState<Bests[K] | undefined>(() => getBests()[gameId])

  useEffect(() => {
    const sync = () => setBestState(getBests()[gameId])
    window.addEventListener(BESTS_CHANGED_EVENT, sync)
    return () => window.removeEventListener(BESTS_CHANGED_EVENT, sync)
  }, [gameId])

  const record = useCallback(
    (value: NonNullable<Bests[K]>) => {
      setBest(gameId, value)
      setBestState(value)
    },
    [gameId],
  )

  return { best, record }
}
