import { useCallback, useEffect, useRef, useState } from 'react'
import { usePostHog } from '@posthog/react'
import { CHIMP_TEST, generateChimpLevel } from '@shared/gameConfig'
import { useLocalBest } from '@/hooks/useLocalBest'
import { useRemoteScore } from '@/hooks/useRemoteScore'

export type ChimpPhase = 'idle' | 'countdown' | 'input' | 'wrongTile' | 'levelUp' | 'result'

const MAX_TILES = CHIMP_TEST.columns * CHIMP_TEST.rows - 1

export function useChimpTestSolo() {
  const [phase, setPhase] = useState<ChimpPhase>('idle')
  const [positions, setPositions] = useState<number[]>([])
  const [progress, setProgress] = useState(0)
  const [revealed, setRevealed] = useState(true)
  const [wrongTileIndex, setWrongTileIndex] = useState<number | null>(null)
  const [levelReached, setLevelReached] = useState(0)
  const { best, record } = useLocalBest('chimp-test')
  const { logResult } = useRemoteScore('chimp-test')
  const posthog = usePostHog()
  const recordedRef = useRef(false)

  const start = useCallback(() => {
    setLevelReached(0)
    recordedRef.current = false
    setPhase('countdown')
    posthog?.capture('game_started', { game: 'chimp-test', mode: 'practice' })
  }, [posthog])

  const onCountdownDone = useCallback(() => {
    setPositions(generateChimpLevel(CHIMP_TEST.startTiles))
    setProgress(0)
    setRevealed(true)
    setPhase('input')
  }, [])

  const handleTileTap = useCallback(
    (cellIndex: number) => {
      if (phase !== 'input') return
      const expectedCell = positions[progress]
      if (cellIndex === expectedCell) {
        const next = progress + 1
        setProgress(next)
        if (progress === 0) setRevealed(false)
        if (next === positions.length) {
          setLevelReached(positions.length)
          setPhase('levelUp')
        }
      } else {
        setWrongTileIndex(cellIndex)
        setPhase('wrongTile')
      }
    },
    [phase, positions, progress],
  )

  useEffect(() => {
    if (phase !== 'levelUp') return
    const t = setTimeout(() => {
      const nextCount = Math.min(positions.length + 1, MAX_TILES)
      setPositions(generateChimpLevel(nextCount))
      setProgress(0)
      setRevealed(true)
      setPhase('input')
    }, CHIMP_TEST.betweenRoundsMs)
    return () => clearTimeout(t)
  }, [phase, positions.length])

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
    logResult(levelReached)
    if (!best || levelReached > best.bestLevel) {
      record({ bestLevel: levelReached, lastPlayedAt: new Date().toISOString() })
    }
  }, [phase, levelReached, best, record, logResult])

  const isNewBest = phase === 'result' && (!best || levelReached > best.bestLevel)

  return {
    phase,
    positions,
    progress,
    revealed,
    wrongTileIndex,
    levelReached,
    isNewBest,
    start,
    onCountdownDone,
    handleTileTap,
  }
}
