import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { REACTION_TIME, generateReactionDelay } from '@shared/gameConfig'
import { useLocalBest } from '@/hooks/useLocalBest'
import { useRemoteScore } from '@/hooks/useRemoteScore'

export type ReactionPhase = 'idle' | 'countdown' | 'waiting' | 'tooSoon' | 'go' | 'roundResult' | 'result'

function average(nums: number[]): number {
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
}

export function useReactionTimeSolo() {
  const [phase, setPhase] = useState<ReactionPhase>('idle')
  const [round, setRound] = useState(1)
  const [attempts, setAttempts] = useState<number[]>([])
  const goAtRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { best, record } = useLocalBest('reaction-time')
  const { logResult } = useRemoteScore('reaction-time')
  const recordedRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  useEffect(() => clearTimer, [clearTimer])

  const armRound = useCallback(() => {
    setPhase('waiting')
    clearTimer()
    timerRef.current = setTimeout(() => {
      goAtRef.current = performance.now()
      setPhase('go')
    }, generateReactionDelay())
  }, [clearTimer])

  const start = useCallback(() => {
    setAttempts([])
    setRound(1)
    recordedRef.current = false
    setPhase('countdown')
  }, [])

  const onCountdownDone = useCallback(() => armRound(), [armRound])

  const handleTap = useCallback(() => {
    if (phase === 'waiting') {
      clearTimer()
      setPhase('tooSoon')
      return
    }
    if (phase === 'tooSoon') {
      armRound()
      return
    }
    if (phase === 'go') {
      const ms = Math.round(performance.now() - goAtRef.current)
      setAttempts((prev) => [...prev, ms])
      setPhase('roundResult')
      return
    }
    if (phase === 'roundResult') {
      if (round >= REACTION_TIME.rounds) {
        setPhase('result')
      } else {
        setRound((r) => r + 1)
        armRound()
      }
    }
  }, [phase, round, armRound, clearTimer])

  const result = useMemo(() => {
    if (phase !== 'result') return null
    const sorted = [...attempts].sort((a, b) => a - b)
    const trimmed = sorted.length > 2 ? sorted.slice(1, -1) : sorted
    const averageMs = average(trimmed)
    return { attempts, averageMs, bestMs: Math.min(...attempts) }
  }, [phase, attempts])

  const isNewBest = !!result && (!best || result.averageMs < best.bestMs)

  useEffect(() => {
    if (!result || recordedRef.current) return
    recordedRef.current = true
    logResult(result.averageMs)
    if (!best || result.averageMs < best.bestMs) {
      record({ bestMs: result.averageMs, lastPlayedAt: new Date().toISOString() })
    }
  }, [result, best, record, logResult])

  return {
    phase,
    round,
    totalRounds: REACTION_TIME.rounds,
    lastMs: attempts[attempts.length - 1],
    result,
    isNewBest,
    start,
    onCountdownDone,
    handleTap,
  }
}
