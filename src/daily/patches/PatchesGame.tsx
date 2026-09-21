import { useState } from 'react'
import { generatePatches, isPatchesSolved, PATCHES_PALETTE, type Rect } from '@/daily/patches/generatePatches'
import { useDailyPuzzle } from '@/daily/shared/useDailyPuzzle'
import { DailyGameCard } from '@/daily/shared/DailyGameCard'
import { Button } from '@/components/ui/Button'
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

export function PatchesGame() {
  const { puzzle, state, setState, progress, completedToday, complete } = useDailyPuzzle<
    ReturnType<typeof generatePatches>,
    PatchesState
  >('patches', generatePatches, () => ({ rects: [] }))
  const { width, height, clues } = puzzle
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
        setState({ rects: next })
        return
      }
    }

    const matchIdx = rects.findIndex((r) => rectsEqual(r, candidate))
    if (matchIdx !== -1) {
      playClick()
      setState({ rects: rects.filter((_, i) => i !== matchIdx) })
      return
    }

    if (overlaps(candidate)) {
      setRejectFlash(true)
      setTimeout(() => setRejectFlash(false), 220)
      return
    }

    playClick()
    const next = [...rects, candidate]
    setState({ rects: next })
    if (isPatchesSolved(next, puzzle)) complete()
  }

  const clear = () => {
    playClick()
    setState({ rects: [] })
  }

  const dragRect = dragStart && dragCurrent ? boundsOf(dragStart, dragCurrent) : null

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

            return (
              <div
                key={idx}
                onPointerDown={() => beginDrag(x, y)}
                onPointerEnter={() => updateDrag(x, y)}
                className="relative flex aspect-square cursor-pointer items-center justify-center border border-dashed border-border/70"
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

        <Button variant="ghost" onClick={clear}>
          Clear all
        </Button>

        <div className="w-full max-w-md rounded-2xl border border-border-strong bg-surface-raised p-4 text-left">
          <p className="mb-2 font-display text-sm font-semibold text-text">How to play</p>
          <ul className="list-disc space-y-1 pl-4 text-sm text-text-muted">
            <li>Each colored seed must grow into a rectangle worth exactly its number of cells.</li>
            <li>Drag to size a rectangle around a seed — every rectangle holds exactly one seed.</li>
            <li>Cover every cell on the board to solve it.</li>
          </ul>
        </div>
      </div>
    </DailyGameCard>
  )
}
