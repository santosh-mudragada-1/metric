import { useCallback, useEffect, useRef, useState } from 'react'
import { TYPING } from '@shared/gameConfig'
import type { TypingRoundContent } from '@shared/roundContent'
import type { TypingResult } from '@shared/types'
import { computeTypingStats } from '@/games/typing/useTypingSolo'
import { usePartyRoom } from '../usePartyRoom'

export function useTypingMultiplayer() {
  const { state, send } = usePartyRoom()
  const [typed, setTyped] = useState('')
  const [done, setDone] = useState(false)
  const [stats, setStats] = useState({ wpm: 0, accuracy: 100 })
  const submittedRef = useRef(false)
  const startTimeRef = useRef(0)
  const typedRef = useRef('')
  typedRef.current = typed

  const text = (state?.roundContent as TypingRoundContent | undefined)?.text ?? ''

  useEffect(() => {
    setTyped('')
    setDone(false)
    submittedRef.current = false
    startTimeRef.current = Date.now()
  }, [state?.round])

  const finish = useCallback(
    (finalTyped: string) => {
      const elapsedMs = Date.now() - startTimeRef.current
      setStats(computeTypingStats(text, finalTyped, elapsedMs))
      setDone(true)
    },
    [text],
  )

  const handleInputChange = useCallback(
    (value: string) => {
      if (done || !text) return
      const clamped = value.length > text.length ? value.slice(0, text.length) : value
      setTyped(clamped)
      if (clamped.length === text.length) finish(clamped)
    },
    [done, text, finish],
  )

  useEffect(() => {
    if (done || !text) return
    const t = setTimeout(() => finish(typedRef.current), TYPING.timeLimitMs)
    return () => clearTimeout(t)
  }, [done, text, finish])

  useEffect(() => {
    if (!done || submittedRef.current) return
    submittedRef.current = true
    const result: TypingResult = { gameId: 'typing', wpm: stats.wpm, accuracy: stats.accuracy }
    send({ type: 'submitResult', result })
  }, [done, stats, send])

  return { text, typed, done, handleInputChange }
}
