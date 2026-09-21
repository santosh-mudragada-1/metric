import { generateQueens, isQueensSolved, type QueensCell } from '@/daily/queens/generateQueens'
import { useDailyPuzzle } from '@/daily/shared/useDailyPuzzle'
import { DailyGameCard } from '@/daily/shared/DailyGameCard'
import { playClick } from '@/lib/sound/sfx'

interface QueensState {
  grid: QueensCell[]
}

function nextCell(v: QueensCell): QueensCell {
  return v === 0 ? 1 : v === 1 ? 2 : 0
}

function Crown({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill={color}>
      <path d="M4 18h16l-1.2-8.2-3.6 2.7L12 6l-3.2 6.5-3.6-2.7L4 18Z" />
    </svg>
  )
}

export function QueensGame() {
  const { puzzle, state, setState, progress, completedToday, complete } = useDailyPuzzle<
    ReturnType<typeof generateQueens>,
    QueensState
  >('queens', generateQueens, (p) => ({ grid: new Array(p.size * p.size).fill(0) as QueensCell[] }))
  const { size, regionOf, palette } = puzzle
  const grid = state.grid

  const toggle = (idx: number) => {
    playClick()
    const next = grid.slice()
    next[idx] = nextCell(next[idx])
    setState({ grid: next })
    if (isQueensSolved(next, puzzle)) complete()
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
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggle(idx)}
                className="relative flex aspect-square cursor-pointer items-center justify-center transition-transform duration-100 active:scale-95"
                style={{ backgroundColor: `${color}4d`, boxShadow: `inset 0 0 0 1px ${color}99` }}
              >
                {value === 1 && <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />}
                {value === 2 && <Crown color={color} />}
              </button>
            )
          })}
        </div>
      </div>
    </DailyGameCard>
  )
}
