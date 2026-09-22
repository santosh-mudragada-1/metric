import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { BackspaceIcon } from '@heroicons/react/24/outline'
import { evaluateGuess, generateHardword, isValidWord, type LetterState } from '@/daily/hardword/generateHardword'
import { useDailyPuzzle } from '@/daily/shared/useDailyPuzzle'
import { DailyGameCard } from '@/daily/shared/DailyGameCard'
import { Button } from '@/components/ui/Button'
import { playClick, playFail } from '@/lib/sound/sfx'
import { withViewTransition } from '@/lib/viewTransition'

interface HardwordState {
  guesses: string[]
}

const KEY_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'back'],
]

const STATE_RANK: Record<LetterState, number> = { absent: 0, present: 1, correct: 2 }

const TILE_CLASSES: Record<LetterState, string> = {
  correct: 'bg-accent-hardword border-accent-hardword text-on-invert',
  present: 'bg-accent-hardword-dim border-accent-hardword/60 text-accent-hardword',
  absent: 'bg-surface border-border text-text-dim',
}

export function HardwordGame() {
  const { puzzle, state, setState, progress, completedToday, complete } = useDailyPuzzle<
    ReturnType<typeof generateHardword>,
    HardwordState
  >('hardword', generateHardword, () => ({ guesses: [] }))
  const navigate = useNavigate()
  const { answer, maxGuesses, length } = puzzle
  const guesses = state.guesses

  const [current, setCurrent] = useState('')
  const [shake, setShake] = useState(false)
  const [revealingRow, setRevealingRow] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const solved = guesses.includes(answer)
  const lost = !solved && guesses.length >= maxGuesses
  const finished = solved || lost
  const locked = finished || revealingRow !== null

  const submit = () => {
    if (locked) return
    if (current.length !== length) {
      setShake(true)
      setTimeout(() => setShake(false), 300)
      return
    }
    if (!isValidWord(current)) {
      playFail()
      setShake(true)
      setTimeout(() => setShake(false), 300)
      return
    }
    const guessWord = current
    const next = [...guesses, guessWord]
    setState({ guesses: next })
    setCurrent('')
    const rowIdx = next.length - 1
    setRevealingRow(rowIdx)
    const revealMs = length * 90 + 420
    setTimeout(() => {
      setRevealingRow(null)
      if (guessWord === answer) complete()
      else if (next.length >= maxGuesses) playFail()
    }, revealMs)
  }

  const backspace = () => setCurrent((c) => c.slice(0, -1))
  const typeLetter = (letter: string) => {
    if (locked) return
    setCurrent((c) => (c.length < length ? c + letter : c))
  }

  useEffect(() => {
    if (locked) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') submit()
      else if (e.key === 'Backspace') backspace()
      else if (/^[a-zA-Z]$/.test(e.key)) typeLetter(e.key.toLowerCase())
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const keyState: Record<string, LetterState> = {}
  guesses.forEach((g) => {
    evaluateGuess(g, answer).forEach((s, i) => {
      const letter = g[i]
      if (!keyState[letter] || STATE_RANK[s] > STATE_RANK[keyState[letter]]) keyState[letter] = s
    })
  })

  return (
    <DailyGameCard
      gameId="hardword"
      completedToday={completedToday}
      progress={progress}
      hasProgress={guesses.length > 0}
    >
      <div className="flex flex-col items-center gap-6">
        <div className={`flex flex-col gap-1.5 ${shake ? 'animate-pulse' : ''}`}>
          {Array.from({ length: maxGuesses }, (_, row) => {
            const guess = guesses[row]
            const isCurrentRow = row === guesses.length && !finished
            const letters = guess ? evaluateGuess(guess, answer) : null
            const isRevealing = row === revealingRow

            return (
              <div key={row} className="flex gap-1.5">
                {Array.from({ length }, (_, col) => {
                  const letter = guess ? guess[col] : isCurrentRow ? current[col] : undefined
                  const letterState = letters?.[col]
                  const revealStyle: CSSProperties = isRevealing
                    ? { animation: 'hardword-reveal 260ms ease-out both', animationDelay: `${col * 90}ms` }
                    : {}
                  return (
                    <div
                      key={col}
                      style={revealStyle}
                      className={`flex h-11 w-11 items-center justify-center rounded-md border font-display text-lg
                        font-bold uppercase sm:h-13 sm:w-13 ${
                          letterState
                            ? TILE_CLASSES[letterState]
                            : letter
                              ? 'border-border-strong bg-surface text-text'
                              : 'border-border bg-surface text-text'
                        }`}
                    >
                      {letter}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {lost && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="font-mono text-sm text-text-muted">
              Out of guesses — it was <span className="font-bold text-text uppercase">{answer}</span>
            </p>
          </div>
        )}

        {!finished && isMobile && <div className="h-52 w-full shrink-0" aria-hidden />}

        {!finished &&
          (() => {
            const keyRows = (
              <>
                {KEY_ROWS.map((row, i) => (
                  <div key={i} className="flex justify-center gap-1.5">
                    {row.map((key) => {
                      if (key === 'enter') {
                        return (
                          <button
                            key={key}
                            disabled={locked}
                            onClick={() => {
                              playClick()
                              submit()
                            }}
                            className="flex h-11 flex-1 items-center justify-center rounded-md border border-border-strong bg-surface-raised px-3 font-mono text-[0.65rem] font-semibold tracking-wide text-text uppercase transition-transform duration-100 hover:bg-surface-hover active:scale-95 disabled:opacity-40 sm:flex-none"
                          >
                            Enter
                          </button>
                        )
                      }
                      if (key === 'back') {
                        return (
                          <button
                            key={key}
                            disabled={locked}
                            onClick={() => {
                              playClick()
                              backspace()
                            }}
                            className="flex h-11 flex-1 items-center justify-center rounded-md border border-border-strong bg-surface-raised px-3 text-text transition-transform duration-100 hover:bg-surface-hover active:scale-95 disabled:opacity-40 sm:flex-none"
                          >
                            <BackspaceIcon className="h-4 w-4" />
                          </button>
                        )
                      }
                      const ks = keyState[key]
                      return (
                        <button
                          key={key}
                          disabled={locked}
                          onClick={() => {
                            playClick()
                            typeLetter(key)
                          }}
                          className={`flex h-11 flex-1 items-center justify-center rounded-md border font-display text-sm font-semibold uppercase
                            transition-transform duration-100 active:scale-95 disabled:opacity-40 sm:w-9 sm:flex-none
                            ${ks ? TILE_CLASSES[ks] : 'border-border-strong bg-surface-raised text-text hover:bg-surface-hover'}`}
                        >
                          {key}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </>
            )

            // On mobile, the keyboard is portaled straight to <body> — GSAP's route-transition
            // tween leaves an inline transform on <main> after it settles, which (per the CSS
            // spec) turns it into a new containing block for any `position: fixed` descendant,
            // silently breaking "stick to the bottom of the viewport". Portaling escapes that.
            return isMobile
              ? createPortal(
                  <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                    <div className="mx-auto flex max-w-md flex-col gap-1.5">{keyRows}</div>
                  </div>,
                  document.body,
                )
              : <div className="flex flex-col gap-1.5">{keyRows}</div>
          })()}

        {lost && (
          <Button variant="ghost" onClick={() => withViewTransition(() => navigate('/daily'))}>
            Back to Daily
          </Button>
        )}
      </div>
    </DailyGameCard>
  )
}
