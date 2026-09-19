import { useCallback, useEffect, useRef, useState } from 'react'
import { NUMBER_MEMORY, generateNumber, numberDisplayMs } from '@shared/gameConfig'
import { useLocalBest } from '@/hooks/useLocalBest'

export type NumberPhase = 'idle' | 'countdown' | 'showing' | 'input' | 'reveal' | 'result'

export function useNumberMemorySolo() {
  const [phase, setPhase] = useState<NumberPhase>('idle')
  const [digitCount, setDigitCount] = useState(NUMBER_MEMORY.startDigits)
  const [currentNumber, setCurrentNumber] = useState('')
  const [input, setInputState] = useState('')
  const [digitsReached, setDigitsReached] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)
  const { best, record } = useLocalBest('number-memory')
  const recordedRef = useRef(false)

  const setInput = useCallback((value: string) => {
    setInputState(value.replace(/\D/g, ''))
  }, [])

  const beginRound = useCallback((digits: number) => {
    setCurrentNumber(generateNumber(digits))
    setInputState('')
    setPhase('showing')
  }, [])

  const start = useCallback(() => {
    setDigitCount(NUMBER_MEMORY.startDigits)
    setDigitsReached(0)
    recordedRef.current = false
    setPhase('countdown')
  }, [])

  const onCountdownDone = useCallback(() => beginRound(NUMBER_MEMORY.startDigits), [beginRound])

  useEffect(() => {
    if (phase !== 'showing') return
    const t = setTimeout(() => setPhase('input'), numberDisplayMs(digitCount))
    return () => clearTimeout(t)
  }, [phase, digitCount])

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
      if (wasCorrect) {
        const next = digitCount + 1
        setDigitCount(next)
        beginRound(next)
      } else {
        setPhase('result')
      }
    }, revealMs)
    return () => clearTimeout(t)
  }, [phase, wasCorrect, currentNumber.length, digitCount, beginRound])

  useEffect(() => {
    if (phase !== 'result' || recordedRef.current) return
    recordedRef.current = true
    if (!best || digitsReached > best.bestDigits) {
      record({ bestDigits: digitsReached, lastPlayedAt: new Date().toISOString() })
    }
  }, [phase, digitsReached, best, record])

  const isNewBest = phase === 'result' && (!best || digitsReached > best.bestDigits)

  return {
    phase,
    digitCount,
    currentNumber,
    input,
    setInput,
    digitsReached,
    wasCorrect,
    isNewBest,
    start,
    onCountdownDone,
    submit,
  }
}
