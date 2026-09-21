import { generateQueens, isQueensSolved, type QueensCell } from '@/daily/queens/generateQueens'
import { useDailyPuzzle } from '@/daily/shared/useDailyPuzzle'
import { useHistory } from '@/daily/shared/useHistory'
import { useCelebration } from '@/daily/shared/useCelebration'
import { DailyGameCard } from '@/daily/shared/DailyGameCard'
import { PuzzleHelp } from '@/daily/shared/PuzzleHelp'
import { Button } from '@/components/ui/Button'
import { ArrowUturnLeftIcon, CheckIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { playClick } from '@/lib/sound/sfx'
import type { CSSProperties } from 'react'

interface QueensState {
  grid: QueensCell[]
}

function nextCell(v: QueensCell): QueensCell {
  return v === 0 ? 1 : v === 1 ? 2 : 0
}

const CROWN_COLOR = '#f0b429'

function Crown({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" style={style}>
      <path
        d="M4 18h16l-1.2-8.2-3.6 2.7L12 6l-3.2 6.5-3.6-2.7L4 18Z"
        fill={CROWN_COLOR}
        stroke="#00000055"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MiniCell({ color, crown, mark }: { color: string; crown?: boolean; mark?: boolean }) {
  return (
    <div className="relative flex h-6 w-6 items-center justify-center rounded-[3px]" style={{ backgroundColor: `${color}cc` }}>
      {crown && <Crown />}
      {mark && <span className="font-display text-[0.6rem] font-bold text-text/70">×</span>}
    </div>
  )
}

function QueensDiagram() {
  return (
    <div className="flex items-center justify-center gap-6 py-1">
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex gap-1">
          <MiniCell color="#f0b429" crown />
          <MiniCell color="#5b8def" mark />
          <MiniCell color="#e0607e" mark />
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-success">
          <CheckIcon className="h-3 w-3 shrink-0" /> one per row, column, color
        </span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex gap-1">
          <MiniCell color="#5b8def" crown />
          <MiniCell color="#5b8def" crown />
          <MiniCell color="#e0607e" />
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-danger">
          <XMarkIcon className="h-3 w-3 shrink-0" /> same color twice
        </span>
      </div>
    </div>
  )
}

export function QueensGame() {
  const { puzzle, state, setState, progress, completedToday, complete } = useDailyPuzzle<
    ReturnType<typeof generateQueens>,
    QueensState
  >('queens', generateQueens, (p) => ({ grid: new Array(p.size * p.size).fill(0) as QueensCell[] }))
  const { pushAndSet, undo, canUndo } = useHistory(state, setState)
  const { celebrating, trigger } = useCelebration(complete)
  const { size, regionOf, palette, solution } = puzzle
  const grid = state.grid

  const toggle = (idx: number) => {
    if (celebrating) return
    playClick()
    const next = grid.slice()
    next[idx] = nextCell(next[idx])
    pushAndSet({ grid: next })
    if (isQueensSolved(next, puzzle)) {
      const crownRows = next.map((v, i) => (v === 2 ? Math.floor(i / size) : -1)).filter((r) => r !== -1)
      trigger(crownRows.length * 90 + 420)
    }
  }

  const hint = () => {
    if (celebrating) return
    const targetRow = solution.findIndex((col, r) => grid[r * size + col] !== 2)
    if (targetRow === -1) return
    playClick()
    const idx = targetRow * size + solution[targetRow]
    const next = grid.slice()
    next[idx] = 2
    pushAndSet({ grid: next })
    if (isQueensSolved(next, puzzle)) trigger(size * 90 + 420)
  }

  return (
    <DailyGameCard
      gameId="queens"
      completedToday={completedToday}
      progress={progress}
      hasProgress={grid.some((v) => v !== 0)}
    >
      <div className="flex flex-col items-center gap-6">
        <div
          className="grid gap-[2px] select-none"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, width: 'min(92vw, 28rem)' }}
        >
          {grid.map((value, idx) => {
            const color = palette[regionOf[idx]]
            const row = Math.floor(idx / size)
            const style: CSSProperties =
              celebrating && value === 2 ? { animation: 'queens-settle 360ms ease-out both', animationDelay: `${row * 90}ms` } : {}
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggle(idx)}
                disabled={celebrating}
                className="relative flex aspect-square cursor-pointer items-center justify-center border border-border-strong transition-transform duration-100 hover:brightness-110 active:scale-95"
                style={{ backgroundColor: `${color}cc` }}
              >
                {value === 1 && <span className="font-display text-lg font-bold text-text/70 sm:text-xl">×</span>}
                {value === 2 && <Crown style={style} />}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" disabled={!canUndo || celebrating} onClick={undo}>
            <ArrowUturnLeftIcon className="h-4 w-4 shrink-0" />
            Undo
          </Button>
          <Button variant="ghost" disabled={celebrating} onClick={hint}>
            <SparklesIcon className="h-4 w-4 shrink-0" />
            Hint
          </Button>
        </div>

        <PuzzleHelp
          tip={
            <>
              A color region with only one open cell left must take its crown there — scan for those before guessing
              anywhere else.
            </>
          }
          diagram={<QueensDiagram />}
          rules={
            <>
              Tap once to mark a cell with ×, twice for a crown. Place exactly one crown in every row, column, and color
              region — and no two crowns may touch, even diagonally.
            </>
          }
        />
      </div>
    </DailyGameCard>
  )
}
