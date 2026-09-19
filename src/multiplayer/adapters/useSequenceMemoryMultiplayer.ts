import { useCallback, useEffect, useRef, useState } from 'react'
import { SEQUENCE_MEMORY } from '@shared/gameConfig'
import type { SequenceMemoryRoundContent } from '@shared/roundContent'
import type { SequenceMemoryResult } from '@shared/types'
import type { SequencePhase } from '@/games/sequence-memory/useSequenceMemorySolo'
import { playFail, playReveal } from '@/lib/sound/sfx'
import { usePartyRoom } from '../usePartyRoom'

export function useSequenceMemoryMultiplayer() {
  const { state, send } = usePartyRoom()
  const [phase, setPhase] = useState<SequencePhase>('showing')
  const [level, setLevel] = useState(SEQUENCE_MEMORY.startLength)
  const [userProgress, setUserProgress] = useState(0)
  const [wrongTileIndex, setWrongTileIndex] = useState<number | null>(null)
  const [levelReached, setLevelReached] = useState(0)
  const [done, setDone] = useState(false)
  const submittedRef = useRef(false)

  const fullSequence = (state?.roundContent as SequenceMemoryRoundContent | undefined)?.sequence ?? []
  const sequence = fullSequence.slice(0, level)

  useEffect(() => {
    setPhase('showing')
    setLevel(SEQUENCE_MEMORY.startLength)
    setUserProgress(0)
    setLevelReached(0)
    setDone(false)
    submittedRef.current = false
  }, [state?.round])

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
      if (level >= fullSequence.length) {
        setDone(true)
        return
      }
      setLevel((l) => l + 1)
      setUserProgress(0)
      setPhase('showing')
    }, SEQUENCE_MEMORY.betweenRoundsMs)
    return () => clearTimeout(t)
  }, [phase, level, fullSequence.length])

  useEffect(() => {
    if (phase !== 'wrongTile') return
    const t = setTimeout(() => {
      setWrongTileIndex(null)
      setDone(true)
    }, 900)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (!done || submittedRef.current) return
    submittedRef.current = true
    const result: SequenceMemoryResult = { gameId: 'sequence-memory', levelReached }
    send({ type: 'submitResult', result })
  }, [done, levelReached, send])

  return { phase, sequence, userProgress, wrongTileIndex, done, onShowComplete, onTileTap: handleTileTap }
}
