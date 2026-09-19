import { useCallback, useEffect, useRef, useState } from 'react'
import { AIM_TRAINER } from '@shared/gameConfig'
import type { AimTrainerRoundContent } from '@shared/roundContent'
import type { AimTrainerResult } from '@shared/types'
import { usePartyRoom } from '../usePartyRoom'

interface Point {
  x: number
  y: number
}

function randomSpawnGap(): number {
  return AIM_TRAINER.minSpawnGapMs + Math.random() * (AIM_TRAINER.maxSpawnGapMs - AIM_TRAINER.minSpawnGapMs)
}

export function useAimTrainerMultiplayer() {
  const { state, send } = usePartyRoom()
  const [target, setTarget] = useState<Point | null>(null)
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [hitTimes, setHitTimes] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const spawnAtRef = useRef(0)
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state
  const submittedRef = useRef(false)

  const clearSpawnTimer = useCallback(() => {
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current)
    spawnTimerRef.current = null
  }, [])

  const spawn = useCallback((index: number) => {
    const content = stateRef.current?.roundContent as AimTrainerRoundContent | undefined
    const pos = content?.targets[index]
    if (!pos) return
    setTarget(pos)
    spawnAtRef.current = performance.now()
  }, [])

  useEffect(() => {
    setHits(0)
    setMisses(0)
    setStreak(0)
    setBestStreak(0)
    setHitTimes([])
    setDone(false)
    submittedRef.current = false
    spawn(0)
    return clearSpawnTimer
  }, [state?.round, spawn, clearSpawnTimer])

  const handleHit = useCallback(() => {
    const ms = Math.round(performance.now() - spawnAtRef.current)
    setHitTimes((prev) => [...prev, ms])
    setStreak((prev) => {
      const next = prev + 1
      setBestStreak((b) => Math.max(b, next))
      return next
    })
    setHits((prev) => {
      const next = prev + 1
      if (next >= AIM_TRAINER.targetCount) {
        clearSpawnTimer()
        setTarget(null)
        setDone(true)
      } else {
        clearSpawnTimer()
        spawnTimerRef.current = setTimeout(() => spawn(next), randomSpawnGap())
      }
      return next
    })
  }, [clearSpawnTimer, spawn])

  const handleMiss = useCallback(() => {
    setMisses((prev) => prev + 1)
    setStreak(0)
  }, [])

  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 100
  const avgHitMs = hitTimes.length > 0 ? Math.round(hitTimes.reduce((a, b) => a + b, 0) / hitTimes.length) : 0

  useEffect(() => {
    if (!done || submittedRef.current) return
    submittedRef.current = true
    const result: AimTrainerResult = { gameId: 'aim-trainer', hits, misses, accuracy, avgHitMs, bestStreak }
    send({ type: 'submitResult', result })
  }, [done, hits, misses, accuracy, avgHitMs, bestStreak, send])

  return {
    phase: 'playing' as const,
    target,
    hits,
    totalTargets: AIM_TRAINER.targetCount,
    streak,
    done,
    onHit: handleHit,
    onMiss: handleMiss,
  }
}
