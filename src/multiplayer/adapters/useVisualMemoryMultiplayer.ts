import { useCallback, useEffect, useRef, useState } from 'react'
import { VISUAL_MEMORY } from '@shared/gameConfig'
import type { VisualMemoryRoundContent } from '@shared/roundContent'
import type { VisualMemoryResult } from '@shared/types'
import type { VisualPhase } from '@/games/visual-memory/useVisualMemorySolo'
import { playFail, playReveal } from '@/lib/sound/sfx'
import { usePartyRoom } from '../usePartyRoom'

export function useVisualMemoryMultiplayer() {
  const { state, send } = usePartyRoom()
  const [phase, setPhase] = useState<VisualPhase>('showing')
  const [index, setIndex] = useState(0)
  const [foundTiles, setFoundTiles] = useState<number[]>([])
  const [wrongTileIndex, setWrongTileIndex] = useState<number | null>(null)
  const [levelReached, setLevelReached] = useState(0)
  const [done, setDone] = useState(false)
  const submittedRef = useRef(false)

  const levels = (state?.roundContent as VisualMemoryRoundContent | undefined)?.levels ?? []
  const targetTiles = levels[index] ?? []

  useEffect(() => {
    setPhase('showing')
    setIndex(0)
    setFoundTiles([])
    setLevelReached(0)
    setDone(false)
    submittedRef.current = false
  }, [state?.round])

  useEffect(() => {
    if (phase !== 'showing' || targetTiles.length === 0) return
    const t = setTimeout(() => setPhase('input'), VISUAL_MEMORY.showMs)
    return () => clearTimeout(t)
  }, [phase, targetTiles.length])

  const handleTileTap = useCallback(
    (tileIndex: number) => {
      if (phase !== 'input' || foundTiles.includes(tileIndex)) return
      if (targetTiles.includes(tileIndex)) {
        const next = [...foundTiles, tileIndex]
        setFoundTiles(next)
        playReveal()
        if (next.length === targetTiles.length) {
          setLevelReached(targetTiles.length)
          setPhase('levelUp')
        }
      } else {
        setWrongTileIndex(tileIndex)
        setPhase('wrongTile')
        playFail()
      }
    },
    [phase, targetTiles, foundTiles],
  )

  useEffect(() => {
    if (phase !== 'levelUp') return
    const t = setTimeout(() => {
      if (index + 1 < levels.length) {
        setIndex((i) => i + 1)
        setFoundTiles([])
        setPhase('showing')
      } else {
        setDone(true)
      }
    }, VISUAL_MEMORY.betweenRoundsMs)
    return () => clearTimeout(t)
  }, [phase, index, levels.length])

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
    const result: VisualMemoryResult = { gameId: 'visual-memory', levelReached }
    send({ type: 'submitResult', result })
  }, [done, levelReached, send])

  return { phase, targetTiles, foundTiles, wrongTileIndex, done, handleTileTap }
}
