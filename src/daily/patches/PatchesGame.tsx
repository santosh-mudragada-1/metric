import { useState } from 'react'
import { generatePatches, isPatchesSolved, PATCHES_PALETTE, type Rect } from '@/daily/patches/generatePatches'
import { useDailyPuzzle } from '@/daily/shared/useDailyPuzzle'
import { DailyComplete } from '@/daily/shared/DailyComplete'
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

  const clueAt = new Map(clues.map((c) => [c.idx, c.value]))
  const coveredBy = new Map<number, number>()
  rects.forEach((rect, ri) => cellsOf(rect, width).forEach((i) => coveredBy.set(i, ri)))

  const overlaps = (rect: Rect, excludeIdx?: number): boolean =>
    cellsOf(rect, width).some((i) => coveredBy.has(i) && coveredBy.get(i) !== excludeIdx)

  const beginDrag = (x: number, y: number) => {
    if (completedToday) return
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
    <div className="flex flex-col items-center gap-6">
      {completedToday ? (
        <DailyComplete gameId="patches" progress={progress} />
      ) : (
        <>
          <div
            className={`grid touch-none gap-[2px] select-none transition-transform ${rejectFlash ? 'animate-pulse' : ''}`}
            style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`, width: 'min(92vw, 32rem)' }}
            onPointerUp={endDrag}
            onPointerLeave={() => dragStart && endDrag()}
          >
            {Array.from({ length: width * height }, (_, idx) => {
              const x = idx % width
              const y = Math.floor(idx / width)
              const rectIdx = coveredBy.get(idx)
              const color = rectIdx !== undefined ? PATCHES_PALETTE[rectIdx % PATCHES_PALETTE.length] : null
              const inDrag =
                dragRect && x >= dragRect.x && x < dragRect.x + dragRect.w && y >= dragRect.y && y < dragRect.y + dragRect.h
              const clueValue = clueAt.get(idx)

              return (
                <div
                  key={idx}
                  onPointerDown={() => beginDrag(x, y)}
                  onPointerEnter={() => updateDrag(x, y)}
                  className="relative flex aspect-square cursor-pointer items-center justify-center rounded-[3px] border border-border bg-surface"
                  style={color ? { backgroundColor: `${color}33`, boxShadow: `inset 0 0 0 1px ${color}80` } : undefined}
                >
                  {inDrag && <div className="absolute inset-0 rounded-[3px] bg-text/15" />}
                  {clueValue !== undefined && (
                    <span className="relative z-10 font-display text-sm font-bold text-text sm:text-base">
                      {clueValue}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <p className="max-w-md text-center text-sm text-text-muted">
            Drag to carve out a rectangle — each one should hold exactly one number equal to its own area. Cover
            every cell.
          </p>
          <Button variant="ghost" onClick={clear}>
            Clear all
          </Button>
        </>
      )}
    </div>
  )
}
