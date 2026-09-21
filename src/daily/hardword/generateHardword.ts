import type { Rng } from '@/lib/dailySeed'
import { WORD_LIST } from '@/daily/hardword/wordList'

export const HARDWORD_MAX_GUESSES = 8
export const HARDWORD_LENGTH = 4

export interface HardwordPuzzle {
  answer: string
  maxGuesses: number
  length: number
}

export function generateHardword(rng: Rng): HardwordPuzzle {
  const answer = WORD_LIST[Math.floor(rng() * WORD_LIST.length)]
  return { answer, maxGuesses: HARDWORD_MAX_GUESSES, length: HARDWORD_LENGTH }
}

export type LetterState = 'correct' | 'present' | 'absent'

export function evaluateGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = new Array(guess.length).fill('absent')
  const answerChars = answer.split('')
  const used = new Array(answer.length).fill(false)

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answerChars[i]) {
      result[i] = 'correct'
      used[i] = true
    }
  }
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === 'correct') continue
    const foundIdx = answerChars.findIndex((ch, j) => !used[j] && ch === guess[i])
    if (foundIdx !== -1) {
      result[i] = 'present'
      used[foundIdx] = true
    }
  }
  return result
}

export function isValidWord(word: string): boolean {
  return WORD_LIST.includes(word.toLowerCase())
}
