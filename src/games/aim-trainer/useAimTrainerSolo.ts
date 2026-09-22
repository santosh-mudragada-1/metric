import { useCallback, useEffect, useRef, useState } from 'react'
import { AIM_TRAINER, generateAimTargets } from '@shared/gameConfig'
import { useLocalBest } from '@/hooks/useLocalBest'
import { useRemoteScore } from '@/hooks/useRemoteScore'

export type AimPhase = 'idle' | 'countdown' | 'playing' | 'result'

interface Point {
  x: number
  y: number
}

function randomSpawnGap(): number {
  return AIM_TRAINER.minSpawnGapMs + Math.random() * (AIM_TRAINER.maxSpawnGapMs - AIM_TRAINER.minSpawnGapMs)
}

export function useAimTrainerSolo() {
  const [phase, setPhase] = useState<AimPhase>('idle')
  const [target, setTarget] = useState<Point | null>(null)
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [hitTimes, setHitTimes] = useState<number[]>([])
  const spawnAtRef = useRef(0)
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { best, record } = useLocalBest('aim-trainer')
  const { logResult } = useRemoteScore('aim-trainer')
  const recordedRef = useRef(false)

  const clearSpawnTimer = useCallback(() => {
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current)
    spawnTimerRef.current = null
  }, [])

  useEffect(() => clearSpawnTimer, [clearSpawnTimer])

  const spawn = useCallback(() => {
    const [pos] = generateAimTargets(1)
    setTarget(pos)
    spawnAtRef.current = performance.now()
  }, [])

  const start = useCallback(() => {
    setHits(0)
    setMisses(0)
    setStreak(0)
    setBestStreak(0)
    setHitTimes([])
    recordedRef.current = false
    setPhase('countdown')
  }, [])

  const onCountdownDone = useCallback(() => {
    setPhase('playing')
    spawn()
  }, [spawn])

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
        setPhase('result')
      } else {
        clearSpawnTimer()
        spawnTimerRef.current = setTimeout(spawn, randomSpawnGap())
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
    if (phase !== 'result' || recordedRef.current) return
    recordedRef.current = true
    logResult(accuracy, { avg_hit_ms: avgHitMs })
    const isBetter =
      !best || accuracy > best.bestAccuracy || (accuracy === best.bestAccuracy && avgHitMs < best.bestAvgHitMs)
    if (isBetter) {
      record({ bestAccuracy: accuracy, bestAvgHitMs: avgHitMs, lastPlayedAt: new Date().toISOString() })
    }
  }, [phase, accuracy, avgHitMs, best, record, logResult])

  const isNewBest =
    phase === 'result' &&
    (!best || accuracy > best.bestAccuracy || (accuracy === best.bestAccuracy && avgHitMs < best.bestAvgHitMs))

  return {
    phase,
    target,
    hits,
    misses,
    streak,
    bestStreak,
    accuracy,
    avgHitMs,
    totalTargets: AIM_TRAINER.targetCount,
    isNewBest,
    start,
    onCountdownDone,
    handleHit,
    handleMiss,
  }
}
