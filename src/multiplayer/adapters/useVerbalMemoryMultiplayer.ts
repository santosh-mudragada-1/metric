import { useCallback, useEffect, useRef, useState } from 'react'
import { VERBAL_MEMORY, wasWordSeenBefore } from '@shared/gameConfig'
import type { VerbalMemoryRoundContent } from '@shared/roundContent'
import type { VerbalMemoryResult } from '@shared/types'
import type { VerbalAnswer, VerbalFeedback } from '@/games/verbal-memory/useVerbalMemorySolo'
import { playFail, playReveal } from '@/lib/sound/sfx'
import { usePartyRoom } from '../usePartyRoom'

export function useVerbalMemoryMultiplayer() {
  const { state, send } = usePartyRoom()
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(VERBAL_MEMORY.lives)
  const [feedback, setFeedback] = useState<VerbalFeedback>(null)
  const [done, setDone] = useState(false)
  const submittedRef = useRef(false)

  const words = (state?.roundContent as VerbalMemoryRoundContent | undefined)?.words ?? []
  const currentWord = words[index] ?? ''

  useEffect(() => {
    setIndex(0)
    setScore(0)
    setLives(VERBAL_MEMORY.lives)
    setFeedback(null)
    setDone(false)
    submittedRef.current = false
  }, [state?.round])

  const handleAnswer = useCallback(
    (answer: VerbalAnswer) => {
      if (done || feedback || index >= words.length) return
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
    [done, feedback, words, index],
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
    if (!done && lives <= 0) setDone(true)
  }, [lives, done])

  useEffect(() => {
    if (!done || submittedRef.current) return
    submittedRef.current = true
    const result: VerbalMemoryResult = { gameId: 'verbal-memory', score }
    send({ type: 'submitResult', result })
  }, [done, score, send])

  return { currentWord, score, lives, feedback, done, handleAnswer }
}
