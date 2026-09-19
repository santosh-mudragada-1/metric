import { useCallback, useState } from 'react'
import { getBests, setBest, type Bests } from '@/lib/storage'

export function useLocalBest<K extends keyof Bests>(gameId: K) {
  const [best, setBestState] = useState<Bests[K] | undefined>(() => getBests()[gameId])

  const record = useCallback(
    (value: NonNullable<Bests[K]>) => {
      setBest(gameId, value)
      setBestState(value)
    },
    [gameId],
  )

  return { best, record }
}
