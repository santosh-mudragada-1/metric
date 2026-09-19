import { useCallback, useEffect, useRef, useState } from 'react'
import { REACTION_TIME } from '@shared/gameConfig'
import type { ReactionTimeRoundContent } from '@shared/roundContent'
import type { ReactionTimeResult } from '@shared/types'
import type { ReactionPhase } from '@/games/reaction-time/useReactionTimeSolo'
import { usePartyRoom } from '../usePartyRoom'

function average(nums: number[]): number {
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
}

export function useReactionTimeMultiplayer() {
  const { state, send } = usePartyRoom()
  const [phase, setPhase] = useState<ReactionPhase>('waiting')
  const [round, setRound] = useState(1)
  const [attempts, setAttempts] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const goAtRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state
  const submittedRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const armRound = useCallback(
    (roundIndex: number) => {
      const content = stateRef.current?.roundContent as ReactionTimeRoundContent | undefined
      const delayMs = content?.delays[roundIndex - 1] ?? 2000
      setPhase('waiting')
      clearTimer()
      timerRef.current = setTimeout(() => {
        goAtRef.current = performance.now()
        setPhase('go')
      }, delayMs)
    },
    [clearTimer],
  )

  useEffect(() => {
    setAttempts([])
    setRound(1)
    setDone(false)
    submittedRef.current = false
    armRound(1)
    return clearTimer
  }, [state?.round, armRound, clearTimer])

  const handleTap = useCallback(() => {
    if (phase === 'waiting') {
      clearTimer()
      setPhase('tooSoon')
      return
    }
    if (phase === 'tooSoon') {
      armRound(round)
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
        setDone(true)
      } else {
        const next = round + 1
        setRound(next)
        armRound(next)
      }
    }
  }, [phase, round, armRound, clearTimer])

  useEffect(() => {
    if (!done || submittedRef.current) return
    submittedRef.current = true
    const sorted = [...attempts].sort((a, b) => a - b)
    const trimmed = sorted.length > 2 ? sorted.slice(1, -1) : sorted
    const averageMs = average(trimmed)
    const result: ReactionTimeResult = { gameId: 'reaction-time', attempts, averageMs }
    send({ type: 'submitResult', result })
  }, [done, attempts, send])

  return {
    phase,
    round,
    totalRounds: REACTION_TIME.rounds,
    lastMs: attempts[attempts.length - 1],
    done,
    onTap: handleTap,
  }
}
