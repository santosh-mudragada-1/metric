import { useEffect, useRef, useState } from 'react'
import { numberDisplayMs } from '@shared/gameConfig'
import { Button } from '@/components/ui/Button'
import { DigitDisplay } from './DigitDisplay'
import type { NumberPhase } from './useNumberMemorySolo'

interface NumberMemoryBoardProps {
  phase: NumberPhase
  digitCount: number
  currentNumber: string
  input: string
  wasCorrect: boolean
  onStart: () => void
  onInputChange: (value: string) => void
  onSubmit: () => void
}

export function NumberMemoryBoard({
  phase,
  digitCount,
  currentNumber,
  input,
  wasCorrect,
  onStart,
  onInputChange,
  onSubmit,
}: NumberMemoryBoardProps) {
  const [barPct, setBarPct] = useState(100)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (phase !== 'showing') return
    setBarPct(100)
    const raf = requestAnimationFrame(() => setBarPct(0))
    return () => cancelAnimationFrame(raf)
  }, [phase, currentNumber])

  useEffect(() => {
    if (phase === 'input') inputRef.current?.focus()
  }, [phase])

  return (
    <div className="flex h-96 flex-col items-center justify-center gap-5 rounded-3xl border border-border bg-surface-raised p-6 text-center">
      {phase === 'idle' && (
        <>
          <p className="font-display text-xl font-semibold lowercase tracking-tight text-text">Number Memory</p>
          <p className="max-w-xs text-sm text-text-muted">
            Memorize the number before it disappears, then type it back. It grows a digit each round.
          </p>
          <Button onClick={onStart} chevron>
            Start
          </Button>
        </>
      )}

      {phase === 'showing' && (
        <div className="flex w-full max-w-xs flex-col items-center gap-4">
          <p className="font-mono text-5xl font-bold tabular-nums text-text">{currentNumber}</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full bg-accent-number transition-[width] ease-linear"
              style={{ width: `${barPct}%`, transitionDuration: `${numberDisplayMs(digitCount)}ms` }}
            />
          </div>
        </div>
      )}

      {phase === 'input' && (
        <div className="flex w-full max-w-xs flex-col items-center gap-4">
          <p className="text-sm text-text-muted">Type the number you saw</p>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            inputMode="numeric"
            autoFocus
            className="w-full rounded-full border border-border-strong bg-surface px-4 py-3 text-center
              font-mono text-3xl tabular-nums tracking-[0.3em] text-text outline-none focus:border-accent-number"
          />
          <Button variant="primary" chevron onClick={onSubmit} disabled={input.length === 0}>
            Submit
          </Button>
        </div>
      )}

      {phase === 'reveal' && (
        <div className="flex flex-col items-center gap-4">
          <p className={`font-display text-lg font-semibold ${wasCorrect ? 'text-success' : 'text-danger'}`}>
            {wasCorrect ? 'Correct!' : 'Not quite'}
          </p>
          <DigitDisplay answer={currentNumber} input={input} wasCorrect={wasCorrect} />
        </div>
      )}
    </div>
  )
}
