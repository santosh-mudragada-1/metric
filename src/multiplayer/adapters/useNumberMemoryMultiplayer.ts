import { useCallback, useEffect, useRef, useState } from 'react'
import { NUMBER_MEMORY, numberDisplayMs } from '@shared/gameConfig'
import type { NumberMemoryRoundContent } from '@shared/roundContent'
import type { NumberMemoryResult } from '@shared/types'
import type { NumberPhase } from '@/games/number-memory/useNumberMemorySolo'
import { usePartyRoom } from '../usePartyRoom'

export function useNumberMemoryMultiplayer() {
  const { state, send } = usePartyRoom()
  const [phase, setPhase] = useState<NumberPhase>('showing')
  const [index, setIndex] = useState(0)
  const [input, setInputState] = useState('')
  const [digitsReached, setDigitsReached] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [done, setDone] = useState(false)
  const submittedRef = useRef(false)

  const numbers = (state?.roundContent as NumberMemoryRoundContent | undefined)?.numbers ?? []
  const currentNumber = numbers[index] ?? ''
  const digitCount = NUMBER_MEMORY.startDigits + index

  const setInput = useCallback((value: string) => setInputState(value.replace(/\D/g, '')), [])

  useEffect(() => {
    setPhase('showing')
    setIndex(0)
    setInputState('')
    setDigitsReached(0)
    setDone(false)
    submittedRef.current = false
  }, [state?.round])

  useEffect(() => {
    if (phase !== 'showing' || !currentNumber) return
    const t = setTimeout(() => setPhase('input'), numberDisplayMs(digitCount))
    return () => clearTimeout(t)
  }, [phase, digitCount, currentNumber])

  const submit = useCallback(() => {
    if (phase !== 'input' || input.length === 0) return
    const correct = input === currentNumber
    setWasCorrect(correct)
    if (correct) setDigitsReached(digitCount)
    setPhase('reveal')
  }, [phase, input, currentNumber, digitCount])

  useEffect(() => {
    if (phase !== 'reveal') return
    const revealMs = 700 + currentNumber.length * 160
    const t = setTimeout(() => {
      if (wasCorrect && index + 1 < numbers.length) {
        setIndex((i) => i + 1)
        setInputState('')
        setPhase('showing')
      } else {
        setDone(true)
      }
    }, revealMs)
    return () => clearTimeout(t)
  }, [phase, wasCorrect, currentNumber.length, index, numbers.length])

  useEffect(() => {
    if (!done || submittedRef.current) return
    submittedRef.current = true
    const result: NumberMemoryResult = { gameId: 'number-memory', digitsReached }
    send({ type: 'submitResult', result })
  }, [done, digitsReached, send])

  return { phase, digitCount, currentNumber, input, setInput, wasCorrect, done, submit }
}
