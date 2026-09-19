import { useCallback, useEffect, useRef, useState } from 'react'
import { VISUAL_MEMORY, generateVisualMemoryLevel } from '@shared/gameConfig'
import { useLocalBest } from '@/hooks/useLocalBest'
import { playFail, playReveal } from '@/lib/sound/sfx'

export type VisualPhase = 'idle' | 'countdown' | 'showing' | 'input' | 'wrongTile' | 'levelUp' | 'result'

const MAX_TILES = VISUAL_MEMORY.gridSize * VISUAL_MEMORY.gridSize - 1

export function useVisualMemorySolo() {
  const [phase, setPhase] = useState<VisualPhase>('idle')
  const [targetTiles, setTargetTiles] = useState<number[]>([])
  const [foundTiles, setFoundTiles] = useState<number[]>([])
  const [wrongTileIndex, setWrongTileIndex] = useState<number | null>(null)
  const [levelReached, setLevelReached] = useState(0)
  const { best, record } = useLocalBest('visual-memory')
  const recordedRef = useRef(false)

  const start = useCallback(() => {
    setLevelReached(0)
    recordedRef.current = false
    setPhase('countdown')
  }, [])

  const onCountdownDone = useCallback(() => {
    setTargetTiles(generateVisualMemoryLevel(VISUAL_MEMORY.startTiles))
    setFoundTiles([])
    setPhase('showing')
  }, [])

  useEffect(() => {
    if (phase !== 'showing') return
    const t = setTimeout(() => setPhase('input'), VISUAL_MEMORY.showMs)
    return () => clearTimeout(t)
  }, [phase])

  const handleTileTap = useCallback(
    (index: number) => {
      if (phase !== 'input' || foundTiles.includes(index)) return
      if (targetTiles.includes(index)) {
        const next = [...foundTiles, index]
        setFoundTiles(next)
        playReveal()
        if (next.length === targetTiles.length) {
          setLevelReached(targetTiles.length)
          setPhase('levelUp')
        }
      } else {
        setWrongTileIndex(index)
        setPhase('wrongTile')
        playFail()
      }
    },
    [phase, targetTiles, foundTiles],
  )

  useEffect(() => {
    if (phase !== 'levelUp') return
    const t = setTimeout(() => {
      const nextCount = Math.min(targetTiles.length + 1, MAX_TILES)
      setTargetTiles(generateVisualMemoryLevel(nextCount))
      setFoundTiles([])
      setPhase('showing')
    }, VISUAL_MEMORY.betweenRoundsMs)
    return () => clearTimeout(t)
  }, [phase, targetTiles.length])

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
    targetTiles,
    foundTiles,
    wrongTileIndex,
    levelReached,
    isNewBest,
    start,
    onCountdownDone,
    handleTileTap,
  }
}
