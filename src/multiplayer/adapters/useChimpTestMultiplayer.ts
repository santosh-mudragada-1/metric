import { useCallback, useEffect, useRef, useState } from 'react'
import { CHIMP_TEST } from '@shared/gameConfig'
import type { ChimpTestRoundContent } from '@shared/roundContent'
import type { ChimpTestResult } from '@shared/types'
import type { ChimpPhase } from '@/games/chimp-test/useChimpTestSolo'
import { usePartyRoom } from '../usePartyRoom'

export function useChimpTestMultiplayer() {
  const { state, send } = usePartyRoom()
  const [phase, setPhase] = useState<ChimpPhase>('input')
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [revealed, setRevealed] = useState(true)
  const [wrongTileIndex, setWrongTileIndex] = useState<number | null>(null)
  const [levelReached, setLevelReached] = useState(0)
  const [done, setDone] = useState(false)
  const submittedRef = useRef(false)

  const levels = (state?.roundContent as ChimpTestRoundContent | undefined)?.levels ?? []
  const positions = levels[index] ?? []

  useEffect(() => {
    setPhase('input')
    setIndex(0)
    setProgress(0)
    setRevealed(true)
    setLevelReached(0)
    setDone(false)
    submittedRef.current = false
  }, [state?.round])

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
      if (index + 1 < levels.length) {
        setIndex((i) => i + 1)
        setProgress(0)
        setRevealed(true)
        setPhase('input')
      } else {
        setDone(true)
      }
    }, CHIMP_TEST.betweenRoundsMs)
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
    const result: ChimpTestResult = { gameId: 'chimp-test', levelReached }
    send({ type: 'submitResult', result })
  }, [done, levelReached, send])

  return { phase, positions, progress, revealed, wrongTileIndex, done, handleTileTap }
}
