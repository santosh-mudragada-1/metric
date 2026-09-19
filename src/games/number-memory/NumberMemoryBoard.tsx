import { useEffect, useRef, useState } from 'react'
import { numberDisplayMs } from '@shared/gameConfig'
import { Button } from '@/components/ui/Button'
import { NumberPreview } from '@/components/previews/NumberPreview'
import { DigitDisplay } from './DigitDisplay'
import type { NumberPhase } from './useNumberMemorySolo'

const PHASE_LABELS: Record<string, string> = {
  showing: 'memorize',
  input: 'recall',
  reveal: 'result',
}

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
    <div className="relative flex h-[65vh] min-h-96 max-h-[38rem] flex-col items-center justify-center gap-5 overflow-hidden rounded-xl border border-border bg-surface p-6 text-center">
      {phase !== 'idle' && (
        <div className="absolute top-5 left-5 flex items-center gap-2 sm:top-7 sm:left-7">
          <span
            className={`h-2 w-2 rounded-full ${phase === 'reveal' ? (wasCorrect ? 'bg-success' : 'bg-danger') : 'bg-accent-number live-loop shadow-[0_0_10px_1px_var(--color-accent-number)]'}`}
          />
          <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">{PHASE_LABELS[phase]}</span>
        </div>
      )}

      {phase === 'idle' && (
        <>
          <div className="mb-2 h-10 w-16 opacity-80">
            <NumberPreview />
          </div>
          <p className="font-display text-2xl font-semibold lowercase tracking-tight text-text">number memory</p>
          <p className="max-w-xs text-sm leading-relaxed text-text-muted">
            Memorize the number before it disappears, then type it back. It grows a digit each round.
          </p>
          <Button onClick={onStart} chevron className="mt-2">
            Start
          </Button>
        </>
      )}

      {phase === 'showing' && (
        <div className="flex w-full max-w-xs flex-col items-center gap-4">
          <p className="font-mono text-readout font-bold tabular-nums text-text">{currentNumber}</p>
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full bg-accent-number transition-[width] ease-linear"
              style={{ width: `${barPct}%`, transitionDuration: `${numberDisplayMs(digitCount)}ms` }}
            />
          </div>
        </div>
      )}

      {phase === 'input' && (
        <div className="flex w-full max-w-xs flex-col items-center gap-5">
          <p className="font-mono text-xs tracking-[0.14em] text-text-dim uppercase">type the number you saw</p>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            inputMode="numeric"
            autoFocus
            className="w-full rounded-lg border border-border-strong bg-surface-raised px-4 py-4 text-center
              font-mono text-4xl tabular-nums tracking-[0.3em] text-text outline-none focus:border-accent-number"
          />
          <Button variant="primary" chevron onClick={onSubmit} disabled={input.length === 0}>
            Submit
          </Button>
        </div>
      )}

      {phase === 'reveal' && (
        <div className="flex flex-col items-center gap-5">
          <p className={`font-display text-2xl font-semibold lowercase ${wasCorrect ? 'text-success' : 'text-danger'}`}>
            {wasCorrect ? 'correct' : 'not quite'}
          </p>
          <DigitDisplay answer={currentNumber} input={input} wasCorrect={wasCorrect} />
        </div>
      )}
    </div>
  )
}
