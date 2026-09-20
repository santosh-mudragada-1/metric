import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { TypingPreview } from '@/components/previews/TypingPreview'
import type { TypingPhase } from './useTypingSolo'

interface TypingBoardProps {
  phase: TypingPhase
  text: string
  typed: string
  onStart: () => void
  onInputChange: (value: string) => void
}

export function TypingBoard({ phase, text, typed, onStart, onInputChange }: TypingBoardProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (phase === 'typing') inputRef.current?.focus()
  }, [phase])

  if (phase === 'idle') {
    return (
      <div className="relative flex h-[65vh] min-h-96 max-h-[38rem] flex-col items-center justify-center gap-4 overflow-hidden rounded-panel border border-border bg-surface p-6 text-center">
        <div className="absolute top-5 left-5 flex items-center gap-2 sm:top-7 sm:left-7">
          <span className="h-2 w-2 rounded-full bg-text-dim" />
          <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">standby</span>
        </div>
        <div className="mb-2 h-8 w-20 opacity-80">
          <TypingPreview />
        </div>
        <p className="font-display text-2xl font-semibold lowercase tracking-tight text-text">typing</p>
        <p className="max-w-xs text-sm leading-relaxed text-text-muted">
          Type the passage as fast and accurately as you can. Speed is measured in words per minute.
        </p>
        <Button onClick={onStart} chevron className="mt-2">
          Start
        </Button>
      </div>
    )
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="relative flex h-[65vh] min-h-96 max-h-[38rem] cursor-text flex-col items-center justify-center gap-6 overflow-hidden rounded-panel border border-border bg-surface p-8 text-center"
    >
      <div className="absolute top-5 left-5 flex items-center gap-2 sm:top-7 sm:left-7">
        <span className="live-loop h-2 w-2 rounded-full bg-accent-typing shadow-[0_0_10px_1px_var(--color-accent-typing)]" />
        <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">typing</span>
      </div>
      <div className="absolute top-5 right-5 font-mono text-sm text-text-dim tabular-nums sm:top-7 sm:right-7">
        {typed.length} / {text.length}
      </div>

      <p className="max-w-xl font-mono text-lg leading-relaxed sm:text-xl">
        {text.split('').map((char, i) => {
          const isTyped = i < typed.length
          const isCurrent = i === typed.length
          const isCorrect = isTyped && typed[i] === char
          return (
            <span
              key={i}
              className={
                isCurrent
                  ? 'shadow-[inset_2px_0_0_0_var(--color-accent-typing)] text-text-muted'
                  : isTyped
                    ? isCorrect
                      ? 'text-text'
                      : 'rounded-[2px] bg-danger-dim text-danger'
                    : 'text-text-dim'
              }
            >
              {char}
            </span>
          )
        })}
      </p>

      <input
        ref={inputRef}
        value={typed}
        onChange={(e) => onInputChange(e.target.value)}
        onPaste={(e) => e.preventDefault()}
        autoFocus
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="absolute h-px w-px opacity-0"
      />
    </div>
  )
}
