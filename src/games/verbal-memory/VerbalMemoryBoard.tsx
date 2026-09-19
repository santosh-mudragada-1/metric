import { VERBAL_MEMORY } from '@shared/gameConfig'
import { Button } from '@/components/ui/Button'
import { VerbalPreview } from '@/components/previews/VerbalPreview'
import type { VerbalAnswer, VerbalFeedback, VerbalPhase } from './useVerbalMemorySolo'

interface VerbalMemoryBoardProps {
  phase: VerbalPhase
  currentWord: string
  score: number
  lives: number
  feedback: VerbalFeedback
  onStart: () => void
  onAnswer: (answer: VerbalAnswer) => void
}

export function VerbalMemoryBoard({
  phase,
  currentWord,
  score,
  lives,
  feedback,
  onStart,
  onAnswer,
}: VerbalMemoryBoardProps) {
  if (phase === 'idle') {
    return (
      <div className="relative flex h-[65vh] min-h-96 max-h-[38rem] flex-col items-center justify-center gap-4 overflow-hidden rounded-panel border border-border bg-surface p-6 text-center">
        <div className="absolute top-5 left-5 flex items-center gap-2 sm:top-7 sm:left-7">
          <span className="h-2 w-2 rounded-full bg-text-dim" />
          <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">standby</span>
        </div>
        <div className="mb-2 h-10 w-16 opacity-80">
          <VerbalPreview />
        </div>
        <p className="font-display text-2xl font-semibold lowercase tracking-tight text-text">verbal memory</p>
        <p className="max-w-xs text-sm leading-relaxed text-text-muted">
          A word appears. Say whether you've seen it before this round, or if it's new. Three mistakes and it's over.
        </p>
        <Button onClick={onStart} chevron className="mt-2">
          Start
        </Button>
      </div>
    )
  }

  const wordColor = feedback === 'correct' ? 'text-success' : feedback === 'wrong' ? 'text-danger' : 'text-text'

  return (
    <div className="relative flex h-[65vh] min-h-96 max-h-[38rem] flex-col items-center justify-center gap-8 overflow-hidden rounded-panel border border-border bg-surface p-6 text-center">
      <div className="absolute top-5 left-5 flex items-center gap-1.5 sm:top-7 sm:left-7">
        {Array.from({ length: VERBAL_MEMORY.lives }).map((_, i) => (
          <span key={i} className={`h-2 w-2 rounded-full ${i < lives ? 'bg-accent-verbal' : 'bg-border-strong'}`} />
        ))}
      </div>
      <div className="absolute top-5 right-5 font-mono text-sm text-text-dim tabular-nums sm:top-7 sm:right-7">
        score {String(score).padStart(2, '0')}
      </div>

      <p className={`font-display text-5xl font-semibold lowercase tracking-tight transition-colors duration-150 sm:text-6xl ${wordColor}`}>
        {currentWord}
      </p>

      <div className="flex gap-3">
        <Button variant="ghost" size="lg" disabled={feedback !== null} onClick={() => onAnswer('new')}>
          New
        </Button>
        <Button variant="ghost" size="lg" disabled={feedback !== null} onClick={() => onAnswer('seen')}>
          Seen
        </Button>
      </div>
    </div>
  )
}
