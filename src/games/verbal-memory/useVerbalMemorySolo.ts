import { useCallback, useEffect, useRef, useState } from 'react'
import { VERBAL_MEMORY, generateVerbalMemoryWords, wasWordSeenBefore } from '@shared/gameConfig'
import { useLocalBest } from '@/hooks/useLocalBest'
import { playFail, playReveal } from '@/lib/sound/sfx'

export type VerbalPhase = 'idle' | 'countdown' | 'playing' | 'result'
export type VerbalAnswer = 'seen' | 'new'
export type VerbalFeedback = 'correct' | 'wrong' | null

export function useVerbalMemorySolo() {
  const [phase, setPhase] = useState<VerbalPhase>('idle')
  const [words, setWords] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(VERBAL_MEMORY.lives)
  const [feedback, setFeedback] = useState<VerbalFeedback>(null)
  const { best, record } = useLocalBest('verbal-memory')
  const recordedRef = useRef(false)

  const start = useCallback(() => {
    setWords(generateVerbalMemoryWords())
    setIndex(0)
    setScore(0)
    setLives(VERBAL_MEMORY.lives)
    setFeedback(null)
    recordedRef.current = false
    setPhase('countdown')
  }, [])

  const onCountdownDone = useCallback(() => setPhase('playing'), [])

  const handleAnswer = useCallback(
    (answer: VerbalAnswer) => {
      if (phase !== 'playing' || feedback || index >= words.length) return
      const correctAnswer: VerbalAnswer = wasWordSeenBefore(words, index) ? 'seen' : 'new'
      const correct = answer === correctAnswer
      setFeedback(correct ? 'correct' : 'wrong')
      if (correct) {
        setScore((s) => s + 1)
        playReveal()
      } else {
        setLives((l) => l - 1)
        playFail()
      }
    },
    [phase, feedback, words, index],
  )

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => {
      setFeedback(null)
      setIndex((i) => i + 1)
    }, 260)
    return () => clearTimeout(t)
  }, [feedback])

  useEffect(() => {
    if (phase === 'playing' && lives <= 0) setPhase('result')
  }, [phase, lives])

  useEffect(() => {
    if (phase !== 'result' || recordedRef.current) return
    recordedRef.current = true
    if (!best || score > best.bestScore) {
      record({ bestScore: score, lastPlayedAt: new Date().toISOString() })
    }
  }, [phase, score, best, record])

  const isNewBest = phase === 'result' && (!best || score > best.bestScore)
  const currentWord = words[index] ?? ''

  return {
    phase,
    currentWord,
    score,
    lives,
    feedback,
    isNewBest,
    start,
    onCountdownDone,
    handleAnswer,
  }
}
