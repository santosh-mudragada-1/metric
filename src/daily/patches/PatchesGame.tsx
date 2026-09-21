import { useState, type CSSProperties } from 'react'
import { generatePatches, isPatchesSolved, PATCHES_PALETTE, type Rect } from '@/daily/patches/generatePatches'
import { useDailyPuzzle } from '@/daily/shared/useDailyPuzzle'
import { useHistory } from '@/daily/shared/useHistory'
import { useCelebration } from '@/daily/shared/useCelebration'
import { DailyGameCard } from '@/daily/shared/DailyGameCard'
import { PuzzleHelp } from '@/daily/shared/PuzzleHelp'
import { Button } from '@/components/ui/Button'
import { ArrowUturnLeftIcon, CheckIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { playClick } from '@/lib/sound/sfx'

interface PatchesState {
  rects: Rect[]
}

interface Point {
  x: number
  y: number
}

function boundsOf(a: Point, b: Point): Rect {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  const w = Math.abs(a.x - b.x) + 1
  const h = Math.abs(a.y - b.y) + 1
  return { x, y, w, h }
}

function rectsEqual(a: Rect, b: Rect): boolean {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h
}

function cellsOf(rect: Rect, width: number): number[] {
  const out: number[] = []
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) out.push(y * width + x)
  }
  return out
}

const STRONG_BORDER = '2px solid var(--color-ink)'
const SEED_BORDER = '1px dashed var(--color-border)'

function PatchesDiagram() {
  return (
    <div className="flex items-center justify-center gap-6 py-1">
      <div className="flex flex-col items-center gap-1.5">
        <div className="grid grid-cols-2 gap-0" style={{ width: '2.75rem' }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="relative flex aspect-square items-center justify-center"
              style={{ backgroundColor: '#5b8defcc', border: STRONG_BORDER, borderWidth: '1.5px' }}
            >
              {i === 0 && <span className="text-[0.6rem] font-bold text-white">4</span>}
            </div>
          ))}
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-success">
          <CheckIcon className="h-3 w-3 shrink-0" /> 4 cells, one seed
        </span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <div className="grid grid-cols-2 gap-0" style={{ width: '2.75rem' }}>
          <div
            className="relative flex aspect-square items-center justify-center"
            style={{ backgroundColor: '#5b8def33', border: '1.5px dashed #5b8def' }}
          >
            <span className="text-[0.6rem] font-bold text-text">4</span>
          </div>
          <div className="relative flex aspect-square items-center justify-center" style={{ border: SEED_BORDER }} />
          <div className="relative flex aspect-square items-center justify-center" style={{ border: SEED_BORDER }} />
          <div className="relative flex aspect-square items-center justify-center" style={{ border: SEED_BORDER }} />
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-danger">
          <XMarkIcon className="h-3 w-3 shrink-0" /> not grown yet
        </span>
      </div>
    </div>
  )
}

export function PatchesGame() {
  const { puzzle, state, setState, progress, completedToday, complete } = useDailyPuzzle<
    ReturnType<typeof generatePatches>,
    PatchesState
  >('patches', generatePatches, () => ({ rects: [] }))
  const { pushAndSet, undo, canUndo } = useHistory(state, setState)
  const { celebrating, trigger } = useCelebration(complete)
  const { width, height, clues, solution } = puzzle
  const rects = state.rects

  const [dragStart, setDragStart] = useState<Point | null>(null)
  const [dragCurrent, setDragCurrent] = useState<Point | null>(null)
  const [rejectFlash, setRejectFlash] = useState(false)

  const clueAt = new Map(clues.map((c) => [c.idx, c]))
  const coveredBy = new Map<number, number>()
  rects.forEach((rect, ri) => cellsOf(rect, width).forEach((i) => coveredBy.set(i, ri)))

  // Per placed rectangle: its color (from whichever seed it contains) and whether it's the right size.
  const rectInfo = rects.map((rect, ri) => {
    const containedClue = clues.find((c) => {
      const cx = c.idx % width
      const cy = Math.floor(c.idx / width)
      return cx >= rect.x && cx < rect.x + rect.w && cy >= rect.y && cy < rect.y + rect.h
    })
    const color = containedClue?.color ?? PATCHES_PALETTE[ri % PATCHES_PALETTE.length]
    const isComplete = containedClue ? rect.w * rect.h === containedClue.value : true
    return { color, isComplete, clueIdx: containedClue?.idx }
  })

  const overlaps = (rect: Rect, excludeIdx?: number): boolean =>
    cellsOf(rect, width).some((i) => coveredBy.has(i) && coveredBy.get(i) !== excludeIdx)

  const beginDrag = (x: number, y: number) => {
    if (celebrating) return
    setDragStart({ x, y })
    setDragCurrent({ x, y })
  }

  const updateDrag = (x: number, y: number) => {
    if (!dragStart) return
    setDragCurrent({ x, y })
  }

  const endDrag = () => {
    if (!dragStart || !dragCurrent) return
    const candidate = boundsOf(dragStart, dragCurrent)
    setDragStart(null)
    setDragCurrent(null)

    const isSingleCell = candidate.w === 1 && candidate.h === 1
    if (isSingleCell) {
      const idx = candidate.y * width + candidate.x
      const existingRectIdx = coveredBy.get(idx)
      if (existingRectIdx !== undefined) {
        playClick()
        const next = rects.filter((_, i) => i !== existingRectIdx)
        pushAndSet({ rects: next })
        return
      }
    }

    const matchIdx = rects.findIndex((r) => rectsEqual(r, candidate))
    if (matchIdx !== -1) {
      playClick()
      pushAndSet({ rects: rects.filter((_, i) => i !== matchIdx) })
      return
    }

    if (overlaps(candidate)) {
      setRejectFlash(true)
      setTimeout(() => setRejectFlash(false), 220)
      return
    }

    playClick()
    const next = [...rects, candidate]
    pushAndSet({ rects: next })
    if (isPatchesSolved(next, puzzle)) trigger(next.length * 60 + 320)
  }

  const hint = () => {
    if (celebrating) return
    const missing = solution.find((r) => !rects.some((pr) => rectsEqual(pr, r)) && !overlaps(r))
    if (!missing) return
    playClick()
    const next = [...rects, missing]
    pushAndSet({ rects: next })
    if (isPatchesSolved(next, puzzle)) trigger(next.length * 60 + 320)
  }

  const dragRect = dragStart && dragCurrent ? boundsOf(dragStart, dragCurrent) : null
  const largestClue = clues.reduce((max, c) => (c.value > max.value ? c : max), clues[0])

  return (
    <DailyGameCard
      gameId="patches"
      completedToday={completedToday}
      progress={progress}
      hasProgress={rects.length > 0}
    >
      <div className="flex flex-col items-center gap-6">
        <div
          className={`grid touch-none select-none transition-transform ${rejectFlash ? 'animate-pulse' : ''}`}
          style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`, width: 'min(92vw, 32rem)' }}
          onPointerUp={endDrag}
          onPointerLeave={() => dragStart && endDrag()}
        >
          {Array.from({ length: width * height }, (_, idx) => {
            const x = idx % width
            const y = Math.floor(idx / width)
            const rectIdx = coveredBy.get(idx)
            const info = rectIdx !== undefined ? rectInfo[rectIdx] : null
            const clue = clueAt.get(idx)
            const inDrag =
              dragRect && x >= dragRect.x && x < dragRect.x + dragRect.w && y >= dragRect.y && y < dragRect.y + dragRect.h

            const neighborSameRect = (dx: number, dy: number) => {
              const nx = x + dx
              const ny = y + dy
              if (nx < 0 || nx >= width || ny < 0 || ny >= height) return false
              return coveredBy.get(ny * width + nx) === rectIdx
            }

            const borderStyle: CSSProperties =
              rectIdx !== undefined
                ? {
                    borderTop: neighborSameRect(0, -1) ? 'none' : STRONG_BORDER,
                    borderBottom: neighborSameRect(0, 1) ? 'none' : STRONG_BORDER,
                    borderLeft: neighborSameRect(-1, 0) ? 'none' : STRONG_BORDER,
                    borderRight: neighborSameRect(1, 0) ? 'none' : STRONG_BORDER,
                  }
                : { border: SEED_BORDER }

            const lockStyle: CSSProperties =
              celebrating && rectIdx !== undefined ? { animation: 'patches-lock 340ms ease-out both', animationDelay: `${rectIdx * 60}ms` } : {}

            return (
              <div
                key={idx}
                onPointerDown={() => beginDrag(x, y)}
                onPointerEnter={() => updateDrag(x, y)}
                className="celebrate-cell relative flex aspect-square cursor-pointer items-center justify-center"
                style={{ ...borderStyle, ...lockStyle }}
              >
                {info && (
                  <div className="absolute inset-0" style={{ backgroundColor: `${info.color}${info.isComplete ? 'cc' : '80'}` }} />
                )}
                {inDrag && <div className="absolute inset-0 bg-text/15" />}
                {clue && (!info || (!info.isComplete && info.clueIdx === idx)) && (
                  <div
                    className="absolute inset-[12%] flex items-center justify-center rounded-lg border-2 border-dashed"
                    style={{ backgroundColor: `${clue.color}66`, borderColor: clue.color }}
                  >
                    <span className="font-display text-sm font-bold text-text sm:text-base">{clue.value}</span>
                  </div>
                )}
              </div>
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
            largestClue ? (
              <>
                Start with the <strong className="text-text">{largestClue.value}</strong>-cell seed — bigger numbers have
                fewer possible rectangle shapes, so they're the fastest to pin down first.
              </>
            ) : (
              'Start with the largest numbered seed — it has fewer possible shapes.'
            )
          }
          diagram={<PatchesDiagram />}
          rules={
            <>
              Each colored seed must grow into a rectangle worth exactly its number of cells. Drag to size a rectangle around
              a seed — every rectangle holds exactly one seed, and together they must cover the whole board.
            </>
          }
        />
      </div>
    </DailyGameCard>
  )
}
