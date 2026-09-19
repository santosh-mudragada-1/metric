import { useCallback, useEffect, useRef, useState } from 'react'
import { SEQUENCE_MEMORY, extendSequence, generateSequence } from '@shared/gameConfig'
import { useLocalBest } from '@/hooks/useLocalBest'
import { playFail, playReveal } from '@/lib/sound/sfx'

export type SequencePhase = 'idle' | 'countdown' | 'showing' | 'input' | 'wrongTile' | 'levelUp' | 'result'

export function useSequenceMemorySolo() {
  const [phase, setPhase] = useState<SequencePhase>('idle')
  const [sequence, setSequence] = useState<number[]>([])
  const [userProgress, setUserProgress] = useState(0)
  const [wrongTileIndex, setWrongTileIndex] = useState<number | null>(null)
  const [levelReached, setLevelReached] = useState(0)
  const { best, record } = useLocalBest('sequence-memory')
  const recordedRef = useRef(false)

  const start = useCallback(() => {
    setLevelReached(0)
    recordedRef.current = false
    setPhase('countdown')
  }, [])

  const onCountdownDone = useCallback(() => {
    setSequence(generateSequence(SEQUENCE_MEMORY.startLength))
    setUserProgress(0)
    setPhase('showing')
  }, [])

  const onShowComplete = useCallback(() => setPhase('input'), [])

  const handleTileTap = useCallback(
    (index: number) => {
      if (phase !== 'input') return
      const expected = sequence[userProgress]
      if (index === expected) {
        const next = userProgress + 1
        setUserProgress(next)
        playReveal()
        if (next === sequence.length) {
          setLevelReached(sequence.length)
          setPhase('levelUp')
        }
      } else {
        setWrongTileIndex(index)
        setPhase('wrongTile')
        playFail()
      }
    },
    [phase, sequence, userProgress],
  )

  useEffect(() => {
    if (phase !== 'levelUp') return
    const t = setTimeout(() => {
      setSequence((prev) => extendSequence(prev))
      setUserProgress(0)
      setPhase('showing')
    }, SEQUENCE_MEMORY.betweenRoundsMs)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'wrongTile') return
    const t = setTimeout(() => {
      setWrongTileIndex(null)
      setPhase('result')
    }, 900)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'result' || recordedRef.current) return
    recordedRef.current = true
    if (!best || levelReached > best.bestLevel) {
      record({ bestLevel: levelReached, lastPlayedAt: new Date().toISOString() })
    }
  }, [phase, levelReached, best, record])

  const isNewBest = phase === 'result' && (!best || levelReached > best.bestLevel)

  return {
    phase,
    sequence,
    userProgress,
    wrongTileIndex,
    levelReached,
    isNewBest,
    start,
    onCountdownDone,
    onShowComplete,
    handleTileTap,
  }
}
