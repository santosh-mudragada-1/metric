import { useCallback, useEffect, useRef, useState } from 'react'
import { generateTypingPassage } from '@shared/gameConfig'
import { useLocalBest } from '@/hooks/useLocalBest'
import { useRemoteScore } from '@/hooks/useRemoteScore'

export type TypingPhase = 'idle' | 'countdown' | 'typing' | 'result'

export function computeTypingStats(text: string, typed: string, elapsedMs: number) {
  const minutes = Math.max(elapsedMs, 1) / 60_000
  let correctChars = 0
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === text[i]) correctChars++
  }
  const wpm = Math.max(0, Math.round(typed.length / 5 / minutes))
  const accuracy = typed.length === 0 ? 100 : Math.max(0, Math.round((correctChars / typed.length) * 100))
  return { wpm, accuracy }
}

export function useTypingSolo() {
  const [phase, setPhase] = useState<TypingPhase>('idle')
  const [text, setText] = useState('')
  const [typed, setTyped] = useState('')
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const { best, record } = useLocalBest('typing')
  const { logResult } = useRemoteScore('typing')
  const recordedRef = useRef(false)
  const startTimeRef = useRef(0)

  const start = useCallback(() => {
    setText(generateTypingPassage())
    setTyped('')
    recordedRef.current = false
    setPhase('countdown')
  }, [])

  const onCountdownDone = useCallback(() => {
    startTimeRef.current = Date.now()
    setTyped('')
    setPhase('typing')
  }, [])

  const finish = useCallback(
    (finalTyped: string) => {
      const elapsedMs = Date.now() - startTimeRef.current
      const stats = computeTypingStats(text, finalTyped, elapsedMs)
      setWpm(stats.wpm)
      setAccuracy(stats.accuracy)
      setPhase('result')
    },
    [text],
  )

  const handleInputChange = useCallback(
    (value: string) => {
      if (phase !== 'typing') return
      const clamped = value.length > text.length ? value.slice(0, text.length) : value
      setTyped(clamped)
      if (clamped.length === text.length) finish(clamped)
    },
    [phase, text, finish],
  )

  useEffect(() => {
    if (phase !== 'result' || recordedRef.current) return
    recordedRef.current = true
    logResult(wpm)
    if (!best || wpm > best.bestWpm || (wpm === best.bestWpm && accuracy > best.bestAccuracy)) {
      record({ bestWpm: wpm, bestAccuracy: accuracy, lastPlayedAt: new Date().toISOString() })
    }
  }, [phase, wpm, accuracy, best, record, logResult])

  const isNewBest = phase === 'result' && (!best || wpm > best.bestWpm)

  return {
    phase,
    text,
    typed,
    wpm,
    accuracy,
    isNewBest,
    start,
    onCountdownDone,
    handleInputChange,
  }
}
